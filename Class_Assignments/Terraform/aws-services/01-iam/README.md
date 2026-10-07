# IAM — Identity and Access Management (Governance)

**Name:** Sumit Akhuli
**Enrollment No:** 24bcs10158

IAM is the AWS service that decides **who** can call AWS and **what** they are allowed to do. Every API request (console click, CLI command, SDK call, Terraform apply) is checked by IAM before it runs. It exists so that one AWS account can be shared safely by many people and programs, each with only the access they need. IAM is a global service and has no extra charge.

## What is IAM?

IAM answers two questions for every request:

1. **Authentication** — who is making this request? (a user, a role session, the root user)
2. **Authorization** — is this identity allowed to do this action on this resource?

The answer comes from **policies** (JSON documents) attached to identities or resources. If no policy allows an action, it is denied by default.

## Users

An IAM user is a long-lived identity inside one AWS account, representing one person or one application.

- Can have a console password and/or **access keys** (access key ID + secret) for CLI/API use.
- Has no permissions until a policy is attached (directly or through a group).
- The **root user** (the email used to create the account) is different: it has full access and cannot be limited by IAM policies. Lock it with MFA and do not use it for daily work.
- For people, AWS now recommends **IAM Identity Center** (single sign-on with temporary credentials) instead of creating many IAM users with long-term keys.

## Groups

A group is a collection of IAM users that share the same permissions.

- Attach a policy to the group once; every member gets it. Example groups: `Developers`, `Admins`, `ReadOnly`.
- A user can be in several groups (permissions add up).
- Groups cannot contain other groups, and a group cannot be used as a principal (you cannot "assume" a group).

## Roles

A role is an identity with permissions but **no password or permanent keys**. Someone or something "assumes" the role and receives **temporary credentials** from AWS STS that expire automatically.

Who assumes roles:

- AWS services — an EC2 instance, a Lambda function, an ECS task.
- Users from another AWS account (cross-account access).
- Users signed in through an external identity provider (SSO, GitHub Actions OIDC).

A role has two policies:

- **Trust policy** — who is allowed to assume the role.
- **Permissions policy** — what the role can do once assumed.

Trust policy that lets EC2 instances assume a role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

For EC2 the role is attached through an **instance profile**; the application on the instance then gets rotating credentials from the instance metadata service, so no keys are stored on disk.

## Policies

A policy is a JSON document with one or more statements. Each statement has:

| Field | Meaning |
|-------|---------|
| `Effect` | `Allow` or `Deny` |
| `Action` | API calls, e.g. `s3:GetObject`, `ec2:StartInstances` |
| `Resource` | ARNs the statement applies to |
| `Condition` | Optional extra checks (source IP, MFA present, tags, HTTPS) |
| `Principal` | Only in resource-based policies: who the statement applies to |

Main policy types:

| Type | Attached to | Example |
|------|-------------|---------|
| AWS managed | Users/groups/roles | `ReadOnlyAccess`, maintained by AWS |
| Customer managed | Users/groups/roles | Your own reusable policy |
| Inline | One identity only | Deleted with the identity |
| Resource-based | A resource | S3 bucket policy, KMS key policy |
| Permissions boundary | User/role | Maximum permissions an identity can ever get |
| SCP (Organizations) | Account/OU | Guardrail for whole accounts |

Least-privilege example — read-only access to one S3 bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListOneBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::my-app-reports"
    },
    {
      "Sid": "ReadObjectsInBucket",
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-app-reports/*"
    }
  ]
}
```

Note the two ARNs: `ListBucket` applies to the bucket itself, `GetObject` applies to objects inside it (`/*`).

## Permissions

Permissions are the final result of evaluating all policies that apply to a request. The rules, in order:

1. **Default deny** — everything starts as denied.
2. **Explicit deny wins** — any matching `Deny` blocks the request, no matter how many `Allow`s exist.
3. **Explicit allow** — the request goes through only if some policy allows it and nothing denies it.
4. Boundaries and SCPs act as **ceilings**: an action must be allowed by them too, otherwise it is denied even if an identity policy allows it.

Useful tool: the **IAM Policy Simulator** and **IAM Access Analyzer** help check what a policy actually allows.

## Least privilege

Give each identity only the actions and resources it needs for its job, and nothing more.

Why: if credentials leak or a program has a bug, the damage is limited to what those permissions allow.

How in practice:

- Start with narrow policies; add permissions when something legitimately fails.
- Scope `Resource` to specific ARNs instead of `"*"`.
- Use `Condition` keys (e.g. require MFA, restrict to a VPC endpoint or tag).
- Use IAM Access Analyzer to generate policies from real CloudTrail activity and to find unused permissions.

## IAM best practices

- Protect the root user: enable MFA, delete root access keys, use it only for the few tasks that need it.
- Use **temporary credentials**: IAM Identity Center for people, roles for workloads.
- Require **MFA** for human users.
- Avoid long-term access keys; if needed, rotate them and remove unused ones.
- Manage permissions through **groups and roles**, not per-user inline policies.
- Apply **least privilege** and review regularly (last-accessed information, Access Analyzer).
- Use **permissions boundaries** and **SCPs** as guardrails in multi-account setups.
- Turn on **CloudTrail** so every API call is logged and auditable.

## Common use cases

- Giving each team member their own login with permissions matching their role.
- Letting an EC2 instance or Lambda function read from S3 / write to DynamoDB without stored keys (via a role).
- Cross-account access, e.g. a CI/CD account deploying into a production account.
- Letting GitHub Actions deploy with Terraform using OIDC and a role instead of saved secrets.
- Enforcing company rules such as "nobody can disable CloudTrail" with deny statements or SCPs.

## Quick summary

- IAM controls authentication (who) and authorization (what) for every AWS API call.
- Users and groups are for long-lived identities; roles give temporary credentials and are preferred.
- Policies are JSON; default is deny, explicit deny always wins.
- Least privilege limits damage from leaked credentials or bugs.
- Protect root with MFA, avoid long-term keys, log everything with CloudTrail.

## References

- IAM User Guide: https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html
- Security best practices in IAM: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
- Policies and permissions: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html
- Policy evaluation logic: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html
- IAM roles: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html
- IAM roles for Amazon EC2: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html
- IAM Identity Center: https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html
