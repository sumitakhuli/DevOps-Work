# DynamoDB and RDS — Managed Databases

**Name:** Sumit Akhuli
**Enrollment No:** 24bcs10158

AWS offers managed databases so you do not have to install, patch, back up and fail over database servers yourself. **DynamoDB** is a serverless NoSQL key-value database built for fast lookups at any scale. **RDS** runs traditional relational (SQL) databases such as MySQL and PostgreSQL for you. They solve different problems, so this document covers both and ends with when to pick which.

## DynamoDB

DynamoDB is a fully managed, serverless NoSQL database. There are no servers or instances to size; you create a table and read/write items through an API, with consistent single-digit millisecond latency.

### NoSQL

"NoSQL" here means:

- **No fixed schema** — apart from the key, each item can have different attributes.
- **No joins** — you design tables around the questions (access patterns) your app will ask, often storing related data together.
- Access is by **key**, not by arbitrary SQL queries. Lookups by key are fast at any size; searching by non-key fields needs an index or a slow full **Scan**.

Capacity modes: **on-demand** (pay per request, scales automatically) or **provisioned** (set read/write capacity, optional auto scaling, cheaper for steady traffic).

### Tables

A table is a collection of items, defined only by its **primary key** (plus optional settings).

- Data is replicated across three AZs in the Region automatically.
- Optional features: **Global Secondary Indexes (GSI)** and **Local Secondary Indexes (LSI)** for other query patterns, **TTL** to auto-delete expired items, **Streams** for change events, **point-in-time recovery**, **global tables** for multi-Region replication.
- Reads are eventually consistent by default; strongly consistent reads can be requested on the table (not on GSIs).

### Items

An item is one record (like a row). Maximum item size is **400 KB**, including attribute names and values.

Example item in an `Orders` table:

```json
{
  "customerId": "C123",
  "orderDate": "2026-09-14#A1001",
  "status": "SHIPPED",
  "total": 1499,
  "items": [
    { "sku": "BOOK-42", "qty": 1 },
    { "sku": "PEN-07", "qty": 3 }
  ]
}
```

### Attributes

Attributes are the fields of an item (like columns, but per item).

- Scalar types: String, Number, Binary, Boolean, Null.
- Document types: List, Map (nested JSON-like data).
- Set types: String Set, Number Set, Binary Set.
- Only key attributes are required; others can differ from item to item.

### Partition key

The **partition key** (also called hash key) decides **which internal partition stores the item**. DynamoDB hashes the value to spread data across storage.

- **Simple primary key** = partition key only, must be unique per item. Example: `userId` in a `Users` table.
- Choose a key with **many distinct values** that are accessed evenly (user ID, order ID). A key with few values (e.g. `status`) creates "hot" partitions.

### Sort key

The **sort key** (range key) is optional. With it, the primary key becomes **composite**: partition key + sort key.

- Many items can share a partition key; within it they are stored **sorted by the sort key**.
- The pair must be unique.
- Enables range queries: `=`, `<`, `>`, `BETWEEN`, `begins_with`.

In the example above, `customerId` is the partition key and `orderDate` is the sort key. Access pattern: "get all orders of customer C123 in September 2026":

```bash
aws dynamodb query \
  --table-name Orders \
  --key-condition-expression "customerId = :c AND begins_with(orderDate, :m)" \
  --expression-attribute-values '{":c": {"S": "C123"}, ":m": {"S": "2026-09"}}'
```

A `Query` reads only one partition, so it stays fast as the table grows; a `Scan` reads the whole table and should be avoided for regular requests.

### Use cases

- User profiles, sessions, shopping carts.
- Gaming leaderboards and player state.
- IoT and event data with time-based sort keys.
- Serverless apps with Lambda + API Gateway.
- Terraform state locking (a table with a `LockID` partition key; newer Terraform versions can also lock using S3 alone).

## RDS

**Amazon RDS (Relational Database Service)** runs SQL databases for you. AWS handles provisioning, OS and engine patching, backups, failover and monitoring; you handle schema, queries and tuning.

### Relational database

A relational database stores data in **tables with fixed columns**, linked through keys, and queried with **SQL**.

- Supports **joins**, complex queries and aggregations.
- **ACID transactions**: multi-row changes either fully happen or not at all.
- Schema enforces structure (data types, foreign keys, constraints).
- Best when data is highly related and queries are not fully known up front.

### Supported engines

| Engine | Notes |
|--------|-------|
| MySQL | Open source |
| PostgreSQL | Open source |
| MariaDB | Open source MySQL fork |
| Oracle | Commercial; license included or bring your own |
| Microsoft SQL Server | Commercial; several editions |
| IBM Db2 | Commercial; added in 2023 |
| Amazon Aurora | AWS-built engine compatible with MySQL or PostgreSQL; storage replicated six ways across three AZs; also a Serverless v2 option |

### DB instances

A DB instance is the managed database server.

- **Instance class** sets CPU and memory, e.g. `db.t4g.micro` (burstable, small/test), `db.m7g` (general), `db.r7g` (memory-heavy).
- **Storage**: General Purpose SSD (`gp3`) or Provisioned IOPS SSD (`io1`/`io2`); storage autoscaling can grow it automatically.
- Lives in a **DB subnet group** (subnets in at least two AZs in your VPC).
- No SSH/OS access; you connect through the database endpoint (DNS name) and port.

Terraform sketch:

```hcl
resource "aws_db_instance" "app" {
  identifier                  = "app-db"
  engine                      = "postgres"
  instance_class              = "db.t4g.micro"
  allocated_storage           = 20
  username                    = "appadmin"
  manage_master_user_password = true   # password stored in Secrets Manager
  db_subnet_group_name        = aws_db_subnet_group.private.name
  vpc_security_group_ids      = [aws_security_group.db.id]
  storage_encrypted           = true
  backup_retention_period     = 7
  multi_az                    = true
  publicly_accessible         = false
}
```

### Security

- **Network**: place the instance in **private subnets**, `publicly_accessible = false`, and allow the DB port only from the app's security group.
- **Encryption at rest** with KMS — must be chosen at creation; it covers storage, backups, snapshots and replicas.
- **Encryption in transit** with TLS/SSL connections.
- **Authentication**: database users, plus **IAM database authentication** (MySQL, MariaDB, PostgreSQL) and master password management in **Secrets Manager**.
- **IAM** controls who can manage RDS resources (create, delete, modify).

### Backups

- **Automated backups**: daily snapshot plus transaction logs, kept for a retention period of up to **35 days** (setting it to 0 disables them).
- **Point-in-time restore** to any second within the retention window (typically up to about 5 minutes before now). A restore always creates a **new** DB instance.
- **Manual snapshots**: taken on demand, kept until you delete them, can be copied across Regions/accounts.

### Multi-AZ

Multi-AZ is for **high availability**, not for performance.

- **Multi-AZ DB instance**: RDS keeps a **standby** in another AZ with **synchronous** replication. The standby is **not readable**. On failure or maintenance, RDS fails over automatically and the same endpoint DNS points to the new primary (usually within a minute or two).
- **Multi-AZ DB cluster** (MySQL and PostgreSQL): one writer and two **readable** standbys in three AZs, with faster failover.
- Aurora handles this differently: its storage is already multi-AZ, and Aurora Replicas act as failover targets.

### Read replicas

Read replicas are for **scaling reads**.

- Replication is **asynchronous**, so replicas can lag slightly behind the primary.
- Each replica has its own endpoint; the app must send read queries there.
- Up to 15 replicas for MySQL, MariaDB and PostgreSQL; can be in the same or another Region.
- A replica can be **promoted** to a standalone database (useful for disaster recovery or migrations).

| | Multi-AZ (instance) | Read replica |
|-|---------------------|--------------|
| Purpose | Availability / failover | Read scaling |
| Replication | Synchronous | Asynchronous |
| Readable? | No | Yes |
| Failover | Automatic | Manual promotion |

### Use cases

- Web and mobile app backends with users, orders, payments.
- E-commerce, ERP, CRM and other transactional systems.
- Lifting existing MySQL/PostgreSQL/Oracle/SQL Server apps into AWS without re-designing them.
- Reporting that needs joins and ad-hoc SQL.

## DynamoDB vs RDS — which one?

| Aspect | DynamoDB | RDS |
|--------|----------|-----|
| Data model | Key-value / document (NoSQL) | Relational tables (SQL) |
| Schema | Flexible, only key required | Fixed schema |
| Queries | By key and indexes; no joins | Full SQL with joins and aggregations |
| Scaling | Automatic, practically unlimited | Bigger instance class + read replicas |
| Servers to manage | None (serverless) | DB instances (sizing, maintenance windows) |
| Transactions | Supported, with limits | Full ACID, core feature |
| Cost behaviour | Pay per request or provisioned capacity + storage | Pay per instance-hour + storage + I/O/backups, even when idle |
| High availability | Built in across 3 AZs | Enable Multi-AZ |
| Pick it when | Access patterns are known, need huge scale and low latency | Data is relational, queries vary, existing SQL apps |

## Quick summary

- DynamoDB is serverless NoSQL; design around access patterns using partition key (+ optional sort key). Items max 400 KB.
- Query by key is fast at any scale; avoid Scan for regular traffic.
- RDS runs managed SQL engines (MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Db2) plus Aurora.
- Multi-AZ = synchronous standby for availability; read replicas = asynchronous copies for read scaling.
- Keep RDS in private subnets, encrypted, with automated backups enabled.

## References

- What is Amazon DynamoDB: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html
- DynamoDB core components: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html
- DynamoDB partition key design: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html
- DynamoDB quotas (400 KB item size): https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ServiceQuotas.html
- DynamoDB Query: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html
- What is Amazon RDS: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html
- RDS backups: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html
- RDS Multi-AZ deployments: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html
- RDS read replicas: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html
- RDS security: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.html
- Amazon Aurora: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html
