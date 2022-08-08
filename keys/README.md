## Generate SSL certificate

To generate a self-signed certificate, run the following in your shell:

```bash
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem
```

This folder contains a dummy self-signed certificate only for demo purposses, **DON'T USE IT IN PRODUCTION**. https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTPS-server/
