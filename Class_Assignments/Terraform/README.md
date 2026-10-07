# Terraform & Infrastructure as Code (Session 18)

**Name:** Sumit Akhuli
**Enrollment No:** 24bcs10158

**Infrastructure as Code (IaC)** means writing infrastructure — buckets, networks, servers — as
code files instead of clicking through the AWS console. The files go into Git, so infrastructure
gets the same things application code has: review, history, and the ability to rebuild it
identically. Terraform reads `.tf` files, compares them with what exists, and makes the
difference.

```text
  .tf files ──► terraform plan ──► "5 to add, 0 to change, 0 to destroy" ──► terraform apply ──► AWS
                      ▲                                                            │
                      └────────────── terraform.tfstate (what Terraform built) ◄───┘
```

## Contents

```text
Terraform/
├── terraform-s3-demo/       Task 1: S3 bucket with Terraform — full workflow + screenshots
│   ├── main.tf  variables.tf  outputs.tf  provider.tf  terraform.tfvars
│   └── README.md
├── aws-services/            Task 2: AWS services research
│   ├── 01-iam/README.md
│   ├── 02-ec2/README.md
│   ├── 03-s3/README.md
│   ├── 04-vpc/README.md
│   └── 05-dynamodb-rds/README.md
├── images/                  screenshots
└── lab/                     raw transcript
```

## Task 1: Terraform S3 demo → [terraform-s3-demo/README.md](terraform-s3-demo/README.md)

A bucket with versioning, AES-256 encryption, a public-access block and one object, taken
through `init → fmt → validate → plan → apply → show → output → destroy`. It ran against
LocalStack (an AWS emulator in Docker) instead of a real AWS account; the README explains why
and how to switch.

Two moments worth seeing:

- `terraform fmt -check` catching a misaligned line, exit code 3
- A second `plan` right after `apply` **detecting drift**. The bucket's tags were missing in
  "AWS" even though Terraform had set them. A second `apply` fixed it, and the next plan said
  `No changes`.

![terraform apply creating the bucket and its four dependent resources](images/task1-6-terraform-apply.png)

![Second plan detecting the missing tags](images/task1-10-plan-detects-drift.png)

![terraform destroy removing everything, bucket last](images/task1-12-terraform-destroy.png)

## Task 2: AWS services research

| # | Service | Category | Covers |
|---|---|---|---|
| 01 | [IAM](aws-services/01-iam/README.md) | Governance | users, groups, roles, policies, permissions, least privilege, best practices |
| 02 | [EC2](aws-services/02-ec2/README.md) | Compute | AMI, instance types, key pairs, security groups, EBS, public/private IP, lifecycle |
| 03 | [S3](aws-services/03-s3/README.md) | Storage | buckets, objects, storage classes, versioning, lifecycle, encryption, bucket policies |
| 04 | [VPC](aws-services/04-vpc/README.md) | Networking | CIDR, subnets, route tables, IGW, NAT, security groups, NACLs, public vs private |
| 05 | [DynamoDB & RDS](aws-services/05-dynamodb-rds/README.md) | Database | NoSQL tables/items/keys; relational engines, backups, Multi-AZ, read replicas |

Several of these show up directly in the Task 1 code. `aws_s3_bucket_versioning`, the
encryption configuration and the public access block are the S3 features from 03-s3. The
default tags (`Owner`, `Project`, `ManagedBy`) are how AWS teams tell who owns what, a topic
covered in 01-iam.
