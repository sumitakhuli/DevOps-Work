# Kubernetes Volumes

**Name:** Sumit Akhuli
**Enrollment No:** 24bcs10158

A container's own filesystem is thrown away every time the container restarts. Volumes are how
Kubernetes gives a container a directory that lives longer than that. The types differ in **how
long** the data lives and **where** it is stored:

| Type | Data lives as long as... | Stored on | Typical use |
|---|---|---|---|
| `emptyDir` | the **Pod** | the node's disk (or RAM) | scratch space, sharing files between containers in one Pod |
| `hostPath` | the **node** | a fixed directory on the node | node agents (log collectors), single-node labs |
| PersistentVolume + Claim | the **PV** (independent of Pods) | a real storage backend | databases, uploads, anything that must survive |

The examples below were all run on Minikube (Kubernetes `v1.37.0`). Commands, output and
screenshots are in the [main README](../README.md#task-1-kubernetes-volumes); the manifests are
in this folder.

---

## emptyDir

An empty directory created when the Pod is scheduled, shared by every container in the Pod, and
**deleted when the Pod is deleted**. A container *restart* keeps it, a Pod *replacement* does not.

```yaml
volumes:
  - name: shared
    emptyDir: {}            # emptyDir: { medium: Memory } puts it in RAM (tmpfs)
```

In [`pod-volumes.yml`](pod-volumes.yml) a `writer` container appends the time to
`/shared/log.txt` every 5 seconds while a `reader` container mounts the same volume read-only.
The reader sees the writer's lines, but cannot write itself (`Read-only file system`). After
deleting and recreating the Pod, the old lines were gone.

**Use for:** caches, temp files, a sidecar reading logs that the main container writes.

## hostPath

Mounts a directory from the **node's** filesystem into the Pod.

```yaml
volumes:
  - name: node-data
    hostPath:
      path: /tmp/session13-hostpath
      type: DirectoryOrCreate
```

The data outlives the Pod: in my run, the file still held a line written by an earlier Pod from
a previous run. The catch is that the data belongs to **one node**. If the Pod is rescheduled
onto another node, it gets a different, empty directory. It also gives the Pod access to the
host's files, which is a security risk, so most production clusters restrict it.

**Use for:** DaemonSets that need node files (`/var/log`, container runtime socket), or a
single-node cluster like Minikube. Not for application data.

## PersistentVolume (PV)

A piece of storage registered in the cluster as an object of its own, independent of any Pod.
It has a size, access modes and a reclaim policy:

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: static-lab-pv
spec:
  capacity:
    storage: 1Gi
  accessModes: [ReadWriteOnce]
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  hostPath:
    path: /tmp/session13-static-pv
```

- **Access modes:** `ReadWriteOnce` (RWO, read-write from one node), `ReadOnlyMany` (ROX),
  `ReadWriteMany` (RWX, needs a shared filesystem like NFS/EFS), `ReadWriteOncePod`.
- **Reclaim policy:** what happens to the storage when its claim is deleted. `Retain` keeps the
  data for an admin to clean up; `Delete` removes the storage too (the default for dynamic volumes).

## PersistentVolumeClaim (PVC)

A **request** for storage made by an application: "I need 500Mi, read-write, from class
`manual`". Kubernetes finds a PV that satisfies it and **binds** the two one-to-one. The Pod only
ever names the claim:

```yaml
volumes:
  - name: data
    persistentVolumeClaim:
      claimName: static-lab-claim
```

This split is the whole idea. The developer writes the claim (how much, what kind), and the
admin or the cloud provides the volume (where it is actually stored). The same Deployment works
on Minikube, EKS or GKE without changes.

In the run, the claim asked for `500Mi` but shows `CAPACITY 1Gi`: it was bound to the only
matching PV, which has 1Gi, and a claim gets the whole volume. A file written by one Pod was
still there when a brand-new Pod mounted the same claim.

## StorageClass

Describes a **kind** of storage and which **provisioner** creates it, e.g. `gp3` SSD on AWS,
`standard` on Minikube:

```text
NAME                 PROVISIONER                RECLAIMPOLICY   VOLUMEBINDINGMODE
standard (default)   k8s.io/minikube-hostpath   Delete          Immediate
```

A cluster can have several (fast SSD, cheap HDD, replicated), and the one marked `(default)` is
used by claims that don't name a class. `volumeBindingMode: WaitForFirstConsumer` delays
creating the disk until a Pod is scheduled, so the disk is created in the same zone as the Pod.

## Dynamic provisioning

With static provisioning, an admin must create PVs in advance. With **dynamic provisioning** the
claim names a StorageClass, and the class's provisioner creates a matching PV automatically:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: dynamic-lab-claim
spec:
  accessModes: [ReadWriteOnce]
  storageClassName: standard
  resources:
    requests:
      storage: 1Gi
```

Before applying it there were 0 PVs for this claim. Four seconds later a PV called
`pvc-e03fa5c4-...` existed and was `Bound`, and the claim's events show the provisioner doing it
(`Provisioning` → `ProvisioningSucceeded`). This is how storage works on every managed cloud
cluster: nobody creates PVs by hand.

---

## Files

| File | What it creates |
|---|---|
| [`pod-volumes.yml`](pod-volumes.yml) | `emptydir-demo` (writer + read-only reader) and `hostpath-demo` |
| [`static-pv-pvc.yml`](static-pv-pvc.yml) | `static-lab-pv` (1Gi, Retain, class `manual`) and `static-lab-claim` (500Mi) |
| [`pvc-pod.yml`](pvc-pod.yml) | `pvc-writer`, a Pod that mounts `static-lab-claim` at `/data` |
| [`dynamic-pvc.yml`](dynamic-pvc.yml) | `dynamic-lab-claim`, provisioned by the `standard` StorageClass |

Cleanup:

```bash
kubectl delete -f .
kubectl delete pv static-lab-pv    # Retain: the PV stays after its claim is gone
```
