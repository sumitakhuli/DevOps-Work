FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV container=docker

# systemd (so journalctl has a real journal), plus the networking / linux tooling
# the Linux Fundamentals + Networking Fundamentals homework needs.
RUN apt-get update && apt-get install -y --no-install-recommends \
      systemd systemd-sysv dbus dbus-user-session \
      iproute2 iputils-ping iputils-tracepath traceroute dnsutils \
      net-tools curl wget telnet netcat-openbsd \
      nginx openssh-server cron rsyslog \
      passwd adduser sudo \
      tree file less nano vim-tiny procps psmisc \
      ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# systemd in a container: strip the units that cannot work and would just error
RUN rm -f /lib/systemd/system/multi-user.target.wants/* \
    /etc/systemd/system/*.wants/* \
    /lib/systemd/system/local-fs.target.wants/* \
    /lib/systemd/system/sockets.target.wants/*udev* \
    /lib/systemd/system/sockets.target.wants/*initctl* \
    /lib/systemd/system/sysinit.target.wants/systemd-tmpfiles-setup* \
    /lib/systemd/system/systemd-update-utmp*

# keep the journal on disk so journalctl has something to read
RUN mkdir -p /var/log/journal /run/systemd/journal \
    && sed -i 's/^#Storage=.*/Storage=persistent/' /etc/systemd/journald.conf

RUN systemctl enable ssh nginx cron 2>/dev/null || true

STOPSIGNAL SIGRTMIN+3
CMD ["/sbin/init"]
