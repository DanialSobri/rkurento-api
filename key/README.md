## Generate SSL certificate

To generate a self-signed certificate, run the following in your shell:

```bash
openssl req -nodes -new -x509 -keyout server.key -out server.cert
```

This folder contains a dummy self-signed certificate only for demo purposses, **DON'T USE IT IN PRODUCTION**. https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTPS-server/
