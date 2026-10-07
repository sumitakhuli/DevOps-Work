# EC2 — Elastic Compute Cloud (Compute)

**Name:** Sumit Akhuli
**Enrollment No:** 24bcs10158

EC2 lets you rent virtual machines (called **instances**) in AWS data centers. You choose the operating system, CPU, memory, disk and network settings, start it in minutes, and pay only while it runs. It exists so you do not have to buy and manage physical servers, and so you can add or remove capacity as demand changes.

## What is EC2?

An EC2 instance is a virtual server running in one **Availability Zone (AZ)** inside a Region. You get full control of the OS (root/Administrator access), which makes EC2 the most flexible compute option in AWS — and also the one where you are responsible for patching, scaling and backups.

Pricing models:

| Model | Idea | Good for |
|-------|------|----------|
| On-Demand | Pay per second/hour, no commitment | Short or unpredictable workloads |
| Savings Plans / Reserved | Commit to 1 or 3 years for a lower rate | Steady, always-on workloads |
| Spot | Use spare capacity at a large discount; AWS can reclaim it with a 2-minute warning | Batch jobs, CI, fault-tolerant work |
| Dedicated Hosts | A physical server just for you | Licensing or compliance needs |

## AMI

An **Amazon Machine Image (AMI)** is the template used to create an instance: the root disk snapshot (OS + installed software), the architecture (x86_64 or arm64), and launch settings.

- Sources: AWS-provided (Amazon Linux 2023, Ubuntu, Windows), AWS Marketplace, community, or your own.
- AMIs are **Regional**; copy one to use it in another Region.
- Building your own AMI ("golden image", e.g. with Packer) makes new instances start already configured.

## Instance types

The instance type sets CPU, memory, network and storage capacity. Naming example: `m7g.large` = family **m**, generation **7**, attribute **g** (AWS Graviton, ARM), size **large**.

| Family | Optimized for | Examples |
|--------|---------------|----------|
| General purpose | Balanced CPU/memory | `t3`, `t4g` (burstable), `m7i`, `m7g` |
| Compute optimized | High CPU per GB RAM | `c7i`, `c7g` |
| Memory optimized | Large RAM | `r7i`, `r7g`, `x2idn` |
| Storage optimized | Fast local disks, high IOPS | `i4i`, `d3` |
| Accelerated computing | GPUs / ML chips | `p5`, `g6`, `inf2`, `trn1` |

`t` instances are **burstable**: they earn CPU credits while idle and spend them under load — cheap for small or spiky workloads.

## Key pairs

A key pair is used to log in to Linux instances over SSH (or to decrypt the Windows Administrator password).

- AWS keeps the **public key** and places it on the instance at launch.
- You download the **private key** (`.pem`) once — AWS does not keep a copy. Lose it and you cannot use it again.
- Types: RSA and ED25519 (ED25519 is not supported for Windows instances).
- Alternative without SSH keys or open port 22: **EC2 Instance Connect** or **Systems Manager Session Manager**.

```bash
chmod 400 my-key.pem
ssh -i my-key.pem ec2-user@<public-ip>
```

## Security Groups

A security group is a **virtual firewall attached to the instance's network interface**.

- Rules only **allow** traffic; there are no deny rules.
- **Stateful**: if inbound traffic is allowed, the reply is automatically allowed out (and vice versa).
- Default: all inbound blocked, all outbound allowed.
- Sources can be CIDR ranges or **other security groups** (e.g. "allow 5432 only from the app-server SG").

| Inbound rule | Port | Source |
|--------------|------|--------|
| SSH | 22 | your IP only, e.g. `203.0.113.10/32` |
| HTTP | 80 | `0.0.0.0/0` |
| HTTPS | 443 | `0.0.0.0/0` |

## EBS

**Elastic Block Store (EBS)** provides network-attached disks (volumes) for instances.

- A volume lives in **one AZ** and attaches to instances in that same AZ.
- Data persists independently of the instance (unless "delete on termination" is set, which is the default for the root volume).
- **Snapshots** are point-in-time, incremental backups stored in S3; they can be copied across Regions and used to create AMIs.
- Encryption with KMS can be turned on by default for the whole account/Region.

| Volume type | Kind | Typical use |
|-------------|------|-------------|
| `gp3` | General purpose SSD (default choice) | Boot disks, most apps |
| `io2` Block Express | Provisioned IOPS SSD | Large, latency-sensitive databases |
| `st1` | Throughput HDD | Big sequential reads (logs, data processing) |
| `sc1` | Cold HDD | Rarely accessed data, lowest cost |

**Instance store** is different: physical disk on the host, very fast, but data is lost when the instance stops or terminates.

## Public vs private IP

| | Private IP | Public IP (auto-assigned) | Elastic IP |
|-|------------|--------------------------|-----------|
| Reachable from | Inside the VPC (and connected networks) | The internet | The internet |
| Assigned | Always, from the subnet's range | If the subnet/launch setting enables it | You allocate and attach it |
| On stop/start | Kept | **Changes** (released and replaced) | Kept |
| Cost | Free | Charged hourly (all public IPv4 since Feb 2024) | Charged hourly, attached or not |

The instance OS only sees its private IP; the internet gateway translates the public IP to it. For a stable public endpoint, use an Elastic IP or (better) a load balancer with DNS.

## Instance lifecycle

| State | Meaning | Billed for compute? |
|-------|---------|---------------------|
| `pending` | Booting up | No |
| `running` | Ready to use | Yes |
| `stopping` | Shutting down to stopped (or hibernating) | No (yes if hibernating) |
| `stopped` | Off; EBS volumes kept | No (EBS storage still billed) |
| `shutting-down` | Being terminated | No |
| `terminated` | Deleted permanently | No |

- **Reboot** keeps the same host, IPs and data.
- **Stop/Start** usually moves to new hardware; public IP changes, instance store data is lost.
- **Hibernate** saves RAM to the EBS root volume and restores it on start.
- Linux On-Demand instances are billed per second (60-second minimum).

Launching an instance with the AWS CLI:

```bash
aws ec2 run-instances \
  --image-id ami-0123456789abcdef0 \
  --instance-type t3.micro \
  --key-name my-key \
  --security-group-ids sg-0123456789abcdef0 \
  --subnet-id subnet-0123456789abcdef0 \
  --iam-instance-profile Name=app-ec2-profile \
  --count 1 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=web-1}]'
```

(IDs above are placeholders.)

## Common use cases

- Hosting web servers and backend APIs.
- Running self-managed databases or software that needs OS-level control.
- CI/CD build agents and batch jobs (often on Spot).
- GPU instances for ML training and inference.
- Auto Scaling groups behind a load balancer for apps whose traffic changes during the day.

## Quick summary

- EC2 = virtual servers; you pick the AMI (template) and instance type (size).
- Key pairs give SSH access; security groups are stateful allow-only firewalls.
- EBS volumes are persistent, AZ-bound disks backed up with snapshots.
- Private IPs stay on stop/start; auto-assigned public IPs change, and public IPv4 is billed hourly.
- You pay for compute only in `running`; stopped instances still pay for EBS.

## References

- What is Amazon EC2: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html
- Instance types: https://docs.aws.amazon.com/ec2/latest/instancetypes/instance-types.html
- Amazon Machine Images: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html
- Key pairs: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html
- Security groups: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security-groups.html
- Amazon EBS volume types: https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html
- Instance IP addressing: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-instance-addressing.html
- Instance lifecycle: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-lifecycle.html
- Public IPv4 charge announcement: https://aws.amazon.com/blogs/aws/new-aws-public-ipv4-address-charge-public-ip-insights/
