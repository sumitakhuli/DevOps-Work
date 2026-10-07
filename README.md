# Learn_DevOps

DevOps class assignments — **Sumit Akhuli**, Enrollment No **24bcs10158**.

All nineteen homework assignments, each with a `README.md` containing the commands I ran, the **real output** captured from those runs, and an explanation of what the output means.

## Class Assignments

| # | Assignment | Submission link |
|---|---|---|
| 1 | Linux Fundamentals | [`Class_Assignments/Linux_Fundamentals/README.md`](Class_Assignments/Linux_Fundamentals/README.md) |
| 2 | Shell Scripting | [`Class_Assignments/Shell_Scripting/README.md`](Class_Assignments/Shell_Scripting/README.md) |
| 3 | Networking Fundamentals | [`Class_Assignments/Networking_Fundamentals/README.md`](Class_Assignments/Networking_Fundamentals/README.md) |
| 4 | Git & GitHub | [`Class_Assignments/Git-GitHub/README.md`](Class_Assignments/Git-GitHub/README.md) |
| 5 | Docker Fundamentals | [`Class_Assignments/Docker_Fundamental/README.md`](Class_Assignments/Docker_Fundamental/README.md) |
| 6 | DockerFiles & Images | [`Class_Assignments/DockerFiles_&_Images/README.md`](Class_Assignments/DockerFiles_&_Images/README.md) |
| 7 | Docker Networking & Volumes | [`Class_Assignments/Docker_Network/README.md`](Class_Assignments/Docker_Network/README.md) |
| 8 | Kubernetes Fundamentals | [`Class_Assignments/Kubernetes_Fundamentals/README.md`](Class_Assignments/Kubernetes_Fundamentals/README.md) |
| 9 | Kubernetes Pods, ReplicaSet & Deployment | [`Class_Assignments/Kubernetes_Pods_Rs_Deployment/README.md`](Class_Assignments/Kubernetes_Pods_Rs_Deployment/README.md) |
| 10 | Kubernetes Networking & Services | [`Class_Assignments/Kubernetes_Networking_and_Services/README.md`](Class_Assignments/Kubernetes_Networking_and_Services/README.md) |
| 11 | Kubernetes Ingress, ConfigMaps & Secrets | [`Class_Assignments/Kubernetes_Ingress_Configmaps_Secrets/README.md`](Class_Assignments/Kubernetes_Ingress_Configmaps_Secrets/README.md) |
| 12 | Kubernetes Storage, HPA & Probes | [`Class_Assignments/Kubernetes_Storage_HPA_Probes/README.md`](Class_Assignments/Kubernetes_Storage_HPA_Probes/README.md) |
| 13 | Kubernetes Troubleshooting | [`Class_Assignments/Kubernetes_Troubleshooting/README.md`](Class_Assignments/Kubernetes_Troubleshooting/README.md) |
| 14 | Helm | [`Class_Assignments/Helm/README.md`](Class_Assignments/Helm/README.md) |
| 15 | CI/CD & GitHub Actions | [`Class_Assignments/CICD_GitHub_Actions/README.md`](Class_Assignments/CICD_GitHub_Actions/README.md) |
| 16 | Complete CI/CD & DevSecOps | [`Class_Assignments/DevSecOps/README.md`](Class_Assignments/DevSecOps/README.md) |
| 17 | Terraform & Infrastructure as Code | [`Class_Assignments/Terraform/README.md`](Class_Assignments/Terraform/README.md) |
| 18 | Cloud & Terraform in Action | [`Class_Assignments/Cloud_and_Terraform_in_Action/README.md`](Class_Assignments/Cloud_and_Terraform_in_Action/README.md) |
| 19 | Monitoring, Observability & GitOps | [`Class_Assignments/Monitoring_Observability_GitOps/README.md`](Class_Assignments/Monitoring_Observability_GitOps/README.md) |

## What each assignment covers

**1. Linux Fundamentals** — soft vs hard links (proved with inode numbers and link counts), `adduser` vs `useradd`, and `journalctl`. Run inside an Ubuntu 24.04 container with **systemd actually running as PID 1**, so the journal output is genuine. Plus a worked Linux command cheat sheet.

**2. Shell Scripting** — a system information script using variables, `date`, `hostname`, `whoami`, `df`, `ps`, `read -p`, `mkdir`, `touch` and `>` / `>>` redirection, with the full run and the report file it produces.

**3. Networking Fundamentals** — 13 networking commands, each with real output and an explanation: `hostname`, `whoami`, `ip a`, `hostname -I`, `ip route`, `ping`, `nslookup`, `curl`, `ss`, `/etc/hosts`, `tracepath`, `traceroute`, `telnet`.

**4. Git & GitHub** — `git commit -m` vs `git commit -a -m` demonstrated on a tracked-modified file *and* an untracked file at the same time, then a cherry-pick of one specific commit out of three, with the commit graph showing the duplicated hash.

**5. Docker Fundamentals** — six Hello World web apps (Node.js, Python, Java, Apache, React, Nginx), each with its own folder and Dockerfile, all built, run, and verified in a browser.

**6. DockerFiles & Images** — a multi-stage Dockerfile serving *Hello World from Docker multi-stage build* on **port 8080**, measured against an identical single-stage build (**1.6GB → 194MB**), plus three multi-stage deployments each showing a different flavour of the technique.

**7. Docker Networking & Volumes** — three containers across three networks with the backend multi-homed and cross-tier isolation proved, Apache on the host network, a bind mount updating live with no restart, and a **real overlay network** built in swarm mode.

**8. Kubernetes Fundamentals** — why Kubernetes over Docker Swarm, the control plane and node components shown running as pods in `kube-system`, namespaced vs cluster-scoped objects, and what actually happens between `kubectl apply` and a running container.

**9. Kubernetes Pods, ReplicaSet & Deployment** — the five workload objects (Pod, ReplicaSet, Deployment, DaemonSet, StatefulSet), the full Pod lifecycle including `Pending`, `CrashLoopBackOff` and `ImagePullBackOff` triggered on purpose and diagnosed, and all four rollout strategies — **rolling update, blue-green, canary and recreate** — with the traffic measured during each switch, including the deliberate outage `Recreate` causes.

**10. Kubernetes Networking & Services** — all five Service types (ClusterIP, NodePort, LoadBalancer, ExternalName, headless), what each creates in the cluster, CoreDNS resolving service FQDNs, per-pod DNS records for a StatefulSet, and an endpoint-triage drill on a Service whose selector does not match its pods.

**11. Kubernetes Ingress, ConfigMaps & Secrets** — configuration kept out of the image with ConfigMaps and Secrets, the **base64 trailing-newline trap** that silently breaks Secret passwords shown byte by byte with `xxd`, and one NGINX Ingress doing host and path-based routing to a frontend and a backend that read from both objects.

**12. Kubernetes Storage, HPA & Probes** — `emptyDir`, `hostPath`, static PV/PVC and dynamic provisioning, each shown keeping (or losing) data when a Pod is deleted; an HPA scaling **1 → 4 → 5** pods at 337% CPU and back down after the 5-minute stabilization window; and a mini project whose liveness probe catches a broken container and restarts it.

**13. Kubernetes Troubleshooting** — the `get → describe → logs → exec` order, then `CrashLoopBackOff`, `ImagePullBackOff`, `Pending`, Service selector and DNS problems each broken on purpose, diagnosed and fixed.

**14. Helm** — every core Helm command, and a rollback workflow where the second upgrade is a deliberately broken image tag that Helm marks `failed` and `helm rollback` repairs; plus the Notes chart deployed with dev values, upgraded to prod values, and rolled back.

**15. CI/CD & GitHub Actions** — a calculator API with test, build/artifact, security-check, Docker build & push and deploy jobs; runs showing a full pass, a pull request where CD is skipped, and a failing test that stops the pipeline.

**16. Complete CI/CD & DevSecOps** — Build → Unit Test → SAST (Bandit) → SCA (pip-audit) → Secret Scan (Gitleaks) → Docker Build → Image Scan (Trivy) → Security Gate → Push → Deploy to Kubernetes. The gate blocked the class app's `debug=True`, then 20 HIGH/CRITICAL CVEs in a stale base image, then passed and deployed; a fourth run proves the secret and dependency scanners.

**17. Terraform & IaC** — an S3 bucket taken through `init → fmt → validate → plan → apply → show → output → destroy`, including drift caught by a second plan, plus research notes on IAM, EC2, S3, VPC, DynamoDB and RDS.

**18. Cloud & Terraform in Action** — VPC, subnet, internet gateway, route table, security group, EC2 with an IAM role, and S3 from one Terraform project: 13 resources, the dependency graph, state, and destroy in reverse order.

**19. Monitoring, Observability & GitOps** — Prometheus, Grafana and 4 alert rules fired by a simulated incident; metrics, JSON logs and OpenTelemetry traces linked by `trace_id`; and Argo CD syncing a Kubernetes app from Git — including a bad commit it refused, self-heal of manual `kubectl` changes, prune, and rollback by `git revert`.

## Evidence

Everything in these READMEs came from running the flow end to end on my own machine:

- **Output** is shown as captured text and as terminal screenshots, including the commands that failed and why.
- **Browser screenshots** are real captures of the pages served by my own running containers.
- **Terminal screenshots** are rendered from the captured output of those same commands.
- **Raw transcripts** and the scripts that produced them are committed under `*/lab/`, so any of it can be re-run.

Where something behaved differently than the task expected — a deprecated base image, a port already in use, a Docker Desktop platform limitation, a truncated HTTP response — it is documented with the actual error and the fix, rather than smoothed over.

## Environment

| | |
|---|---|
| Host | macOS (Apple Silicon, `arm64`) |
| Docker | `29.5.3`, Docker Desktop |
| Git | `2.51.0` |
| Linux environment | Ubuntu 24.04.4 LTS in Docker, with systemd as PID 1 |
| Kubernetes | Minikube, Kubernetes `v1.37.0` (Kubernetes assignments); kind (DevSecOps deploy target) |
| CI/CD | GitHub Actions workflows run locally with `act` `v0.2.89` |
| AWS | Terraform `v1.16.4` against LocalStack `4.0` (an AWS emulator in Docker) |

Linux-only commands (`adduser`, `useradd`, `journalctl`, `ip`, `ss`, `tracepath`, `traceroute`) were run in the Ubuntu container, because macOS does not provide them. The Dockerfile for that environment is committed at [`Class_Assignments/Linux_Fundamentals/lab/Dockerfile`](Class_Assignments/Linux_Fundamentals/lab/Dockerfile).


#   D e v O p s - W o r k  
 