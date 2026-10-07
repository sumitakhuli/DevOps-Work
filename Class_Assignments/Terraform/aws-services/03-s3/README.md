# S3 — Simple Storage Service (Object Storage)

**Name:** Sumit Akhuli
**Enrollment No:** 24bcs10158

S3 stores files (called **objects**) in containers (called **buckets**) and serves them over HTTPS. You do not manage disks or servers; storage grows automatically and you pay for what you store and transfer. It exists to give applications a cheap, highly durable place for any amount of data — backups, logs, images, static websites, data lakes, Terraform state.

## What is S3?

S3 is **object storage**, not a file system or a disk:

- You read and write whole objects through an API (`PUT`, `GET`, `DELETE`, `LIST`), not by mounting a drive.
- Designed for **99.999999999% (11 nines) durability** by storing data redundantly across multiple AZs (except One Zone classes).
- **Strong read-after-write consistency** for all operations since December 2020: after a successful write or delete, the next read or list sees the change.
- Data lives in the Region you choose.

## Buckets

A bucket is the top-level container for objects.

- Name must be **globally unique** (DNS-compatible, lowercase), e.g. `utkarsh-devops-artifacts-2026`.
- Created in one Region.
- Settings live at bucket level: versioning, encryption, lifecycle rules, bucket policy, logging, replication.
- Secure defaults for new buckets (since April 2023): **Block Public Access is on** and **ACLs are disabled** (Object Ownership = bucket owner enforced). Access is controlled with IAM and bucket policies.

## Objects

An object = **key** (its name) + **data** + **metadata**.

- Key example: `logs/2026/10/app.log`. There are no real folders; the `/` is just part of the key, and the console shows it as folders (prefixes).
- Maximum object size is **5 TB**. A single `PUT` uploads up to 5 GB; larger files need **multipart upload** (recommended above ~100 MB).
- Each object has metadata (content type, custom tags) and, with versioning, a version ID.

```bash
aws s3 cp report.pdf s3://utkarsh-devops-artifacts-2026/reports/report.pdf
aws s3 ls s3://utkarsh-devops-artifacts-2026/reports/
```

## Storage classes

All classes have the same durability; they differ in availability, retrieval time and cost trade-off (cheaper storage usually means retrieval fees and minimum storage durations).

| Class | Use when | Retrieval | Min. duration |
|-------|----------|-----------|---------------|
| S3 Standard | Frequently accessed data | Milliseconds | None |
| S3 Intelligent-Tiering | Unknown or changing access patterns; moves objects between tiers automatically | Milliseconds (optional archive tiers slower) | None |
| S3 Express One Zone | Very low latency, single AZ, high request rates | Single-digit ms | None |
| S3 Standard-IA | Infrequent access, but must be fast | Milliseconds | 30 days |
| S3 One Zone-IA | Infrequent, re-creatable data (one AZ only) | Milliseconds | 30 days |
| S3 Glacier Instant Retrieval | Archive accessed about once a quarter | Milliseconds | 90 days |
| S3 Glacier Flexible Retrieval | Archive, access a few times a year | Minutes to hours | 90 days |
| S3 Glacier Deep Archive | Long-term retention (compliance) | Hours (up to ~12-48 h) | 180 days |

## Versioning

Versioning keeps every version of an object in the bucket.

- Bucket states: **unversioned** (default), **enabled**, **suspended**. Once enabled, it can only be suspended, never returned to unversioned.
- Overwriting an object creates a new version; the old one stays.
- Deleting an object adds a **delete marker**; earlier versions can still be restored.
- Why: protects against accidental overwrites/deletes and ransomware-style changes. Strongly recommended for Terraform state buckets.
- Every version is billed as storage — combine with lifecycle rules to expire old versions.

## Lifecycle policies

Lifecycle rules automatically **move objects to cheaper classes** or **delete them** after a number of days, so you do not pay Standard prices for old data.

Example: logs move to Standard-IA after 30 days, to Glacier Flexible Retrieval after 90 days, are deleted after 365 days; old versions and failed multipart uploads are cleaned up.

```json
{
  "Rules": [
    {
      "ID": "archive-then-expire-logs",
      "Filter": { "Prefix": "logs/" },
      "Status": "Enabled",
      "Transitions": [
        { "Days": 30, "StorageClass": "STANDARD_IA" },
        { "Days": 90, "StorageClass": "GLACIER" }
      ],
      "Expiration": { "Days": 365 },
      "NoncurrentVersionExpiration": { "NoncurrentDays": 30 },
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
    }
  ]
}
```

Applied with:

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket utkarsh-devops-artifacts-2026 \
  --lifecycle-configuration file://lifecycle.json
```

## Encryption

- **In transit:** use HTTPS (TLS). Can be enforced with a bucket policy (below).
- **At rest (server-side):**

| Option | Who manages keys | Notes |
|--------|------------------|-------|
| SSE-S3 | S3 | **Default for all new objects since January 2023**, no extra cost |
| SSE-KMS | AWS KMS key (AWS managed or your own) | Key policy control + CloudTrail audit of key use; use S3 Bucket Keys to reduce KMS request costs |
| DSSE-KMS | AWS KMS | Two layers of encryption, for strict compliance needs |
| SSE-C | You provide the key on each request | AWS does not store the key |

- **Client-side encryption:** data is encrypted before upload; S3 only sees ciphertext.

## Bucket policies

A bucket policy is a **resource-based JSON policy** on the bucket. It says which principals can do what on the bucket and its objects, and can add conditions. It works together with IAM policies (explicit deny wins).

Example: deny any request that does not use HTTPS.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::utkarsh-devops-artifacts-2026",
        "arn:aws:s3:::utkarsh-devops-artifacts-2026/*"
      ],
      "Condition": { "Bool": { "aws:SecureTransport": "false" } }
    }
  ]
}
```

Other common uses: grant another AWS account access, allow only a specific VPC endpoint, or allow CloudFront (via Origin Access Control) to read a private bucket.

## Common use cases

- Backups and disaster-recovery copies (often with Cross-Region Replication).
- Static website hosting, usually behind CloudFront.
- Storing user uploads (images, documents) for web and mobile apps.
- Log and data lake storage queried with Athena, EMR or Glue.
- **Terraform remote state** (versioning enabled, encryption on, state locking with an S3 lock file or a DynamoDB table).
- Build artifacts and deployment packages for CI/CD.

## Quick summary

- S3 stores objects (key + data + metadata) in globally uniquely named buckets.
- 11 nines durability, strong read-after-write consistency, objects up to 5 TB.
- Storage classes trade access speed for price; lifecycle rules move/delete data automatically.
- Versioning protects against accidental deletes; SSE-S3 encryption is on by default.
- New buckets block public access and disable ACLs; use bucket policies and IAM for access.

## References

- What is Amazon S3: https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html
- S3 consistency model: https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html#ConsistencyModel
- Storage classes: https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html
- Versioning: https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html
- Lifecycle management: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html
- Default encryption: https://docs.aws.amazon.com/AmazonS3/latest/userguide/default-encryption-faq.html
- Bucket policies: https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html
- Blocking public access: https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html
- Object Ownership / disabling ACLs: https://docs.aws.amazon.com/AmazonS3/latest/userguide/about-object-ownership.html
