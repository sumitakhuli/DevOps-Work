# VPC — Virtual Private Cloud (Networking)

**Name:** Sumit Akhuli
**Enrollment No:** 24bcs10158

A VPC is your own private, isolated network inside AWS. You choose its IP address range, split it into subnets, and decide how traffic flows in, out and between resources. It exists so that servers and databases can talk to each other privately, while you control exactly which parts are reachable from the internet.

## What is VPC?

- A VPC belongs to **one Region** and spans all AZs in that Region.
- Resources such as EC2 instances, RDS databases, load balancers and Lambda (when VPC-attached) are placed in its subnets.
- Every Region has a **default VPC** (`172.31.0.0/16`) with public subnets, convenient for learning; production setups normally use a custom VPC.
- Building blocks: CIDR range, subnets, route tables, internet gateway, NAT gateway, security groups, network ACLs.

## CIDR

**CIDR** notation describes an IP range as `address/prefix`. The prefix says how many leading bits are fixed; the rest are host addresses.

| CIDR | Addresses | Typical use |
|------|-----------|-------------|
| `10.0.0.0/16` | 65,536 | Whole VPC (largest allowed) |
| `10.0.1.0/24` | 256 | One subnet |
| `10.0.1.0/28` | 16 | Smallest allowed subnet |

- VPC IPv4 block: between `/16` and `/28`, normally from private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
- Plan ranges so they do not overlap with other VPCs or on-premises networks you may connect later (peering/VPN cannot route overlapping ranges).
- AWS reserves **5 addresses per subnet** (first four and last one), so a `/24` gives 251 usable IPs.
- IPv6 blocks can be added as well (dual-stack).

## Subnets

A subnet is a slice of the VPC's CIDR that lives in **exactly one AZ**. Spreading subnets across AZs is how you survive an AZ failure.

Example plan for `10.0.0.0/16` in two AZs:

| Subnet | AZ | CIDR | Purpose |
|--------|----|------|---------|
| public-a | ap-south-1a | `10.0.1.0/24` | Load balancer, NAT gateway, bastion |
| public-b | ap-south-1b | `10.0.2.0/24` | Same, second AZ |
| private-a | ap-south-1a | `10.0.11.0/24` | App servers, databases |
| private-b | ap-south-1b | `10.0.12.0/24` | Same, second AZ |

```
                         Internet
                            |
                    [Internet Gateway]
                            |
  VPC 10.0.0.0/16 ----------+------------------------------
  |                                                       |
  |  AZ ap-south-1a                 AZ ap-south-1b        |
  |  +--------------------+         +--------------------+|
  |  | public-a           |         | public-b           ||
  |  | 10.0.1.0/24        |         | 10.0.2.0/24        ||
  |  | ALB, NAT GW-a      |         | ALB, NAT GW-b      ||
  |  +---------+----------+         +---------+----------+|
  |            |                              |           |
  |  +---------v----------+         +---------v----------+|
  |  | private-a          |         | private-b          ||
  |  | 10.0.11.0/24       |         | 10.0.12.0/24       ||
  |  | app EC2, RDS       |         | app EC2, RDS       ||
  |  +--------------------+         +--------------------+|
  ---------------------------------------------------------
```

Terraform sketch of the same layout:

```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
}

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-south-1a"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "ap-south-1a"
}
```

## Route tables

A route table is a list of rules: "traffic for destination X goes to target Y". Each subnet is associated with one route table (or uses the VPC's **main** route table).

- Every route table has a built-in **local** route (`10.0.0.0/16 -> local`) so all subnets in the VPC can reach each other.
- The most specific matching route wins.

| Route table | Destination | Target |
|-------------|-------------|--------|
| public-rt | `10.0.0.0/16` | local |
| public-rt | `0.0.0.0/0` | Internet Gateway |
| private-rt-a | `10.0.0.0/16` | local |
| private-rt-a | `0.0.0.0/0` | NAT Gateway in public-a |

## Internet Gateway

An **Internet Gateway (IGW)** connects the VPC to the internet.

- One per VPC; AWS runs it as a redundant, horizontally scaled component, so it is not a bottleneck or single point of failure.
- Translates between an instance's private IP and its public IP.
- An instance is reachable from the internet only if: its subnet routes `0.0.0.0/0` to the IGW, it has a public IP, and security group / NACL rules allow the traffic.
- No hourly charge for the IGW itself (data transfer and public IPv4 addresses are billed).

## NAT Gateway

A **NAT Gateway** lets instances in private subnets start connections **out** to the internet (OS updates, external APIs) while blocking connections started **from** the internet.

- Placed in a **public subnet** with an Elastic IP; private route tables send `0.0.0.0/0` to it.
- It is **per-AZ**. For high availability create one in each AZ and route each private subnet to the NAT in its own AZ (also avoids cross-AZ data charges).
- Cost: charged **per hour** it exists **plus per GB** processed — often a noticeable line on the bill. Turn it off in labs when not needed.
- For traffic to S3 or DynamoDB, a free **gateway VPC endpoint** avoids sending that traffic through the NAT.
- For IPv6, an **egress-only internet gateway** plays the same outbound-only role.

## Security Groups

A security group is a firewall at the **instance / network interface** level.

- **Allow rules only**; anything not allowed is denied.
- **Stateful**: return traffic for an allowed connection is automatically allowed.
- All rules are evaluated together (no order).
- Can reference other security groups, e.g. DB SG allows port 5432 only from the app SG.

## Network ACLs

A network ACL is a firewall at the **subnet** level.

- **Stateless**: return traffic must be explicitly allowed (usually ephemeral ports 1024-65535).
- Has both **allow and deny** rules.
- Rules are **numbered** and evaluated from lowest to highest; the first match decides. A final `*` rule denies everything else.
- The default NACL allows all traffic; a newly created custom NACL denies all until you add rules.

| | Security Group | Network ACL |
|-|----------------|-------------|
| Applies to | Instance / ENI | Whole subnet |
| State | Stateful | Stateless |
| Rule types | Allow only | Allow and deny |
| Evaluation | All rules together | Numbered order, first match wins |
| Typical use | Main access control | Extra guardrail, block specific IP ranges |

## Public vs private subnet

The difference is only the **route table**, not a setting on the subnet itself.

| | Public subnet | Private subnet |
|-|---------------|----------------|
| Default route | `0.0.0.0/0 -> Internet Gateway` | `0.0.0.0/0 -> NAT Gateway` (or none) |
| Inbound from internet | Possible (with public IP + rules) | Not possible |
| Outbound to internet | Directly via IGW | Via NAT only |
| Typical resources | Load balancers, NAT gateways, bastion hosts | App servers, databases, caches |

Common pattern: users hit a load balancer in public subnets, which forwards to app servers in private subnets, which talk to an RDS database in private subnets.

## Quick summary

- A VPC is a private network in one Region; subnets live in single AZs.
- Plan a non-overlapping CIDR (e.g. `10.0.0.0/16`) and split it into public and private `/24` subnets across at least two AZs.
- Route tables decide where traffic goes; a route to the IGW makes a subnet public.
- NAT gateways give private subnets outbound-only internet; they are per-AZ and billed hourly plus per GB.
- Security groups are stateful allow-only; NACLs are stateless with numbered allow/deny rules.

## References

- What is Amazon VPC: https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html
- VPC CIDR blocks: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html
- Subnets (including reserved IPs): https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html
- Route tables: https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Route_Tables.html
- Internet gateways: https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html
- NAT gateways: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html
- Security groups: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html
- Network ACLs: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html
- Gateway endpoints: https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html
- VPC pricing: https://aws.amazon.com/vpc/pricing/
