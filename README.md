# 💨 netlify-to-cloudflare-dns

> Quick script to move my domain's DNS records from Netlify to Cloudflare

- Refer to the [.env.example](.env.example) file and create a `.env` from it.
- The `NETLIFY_AUTHORIZATION_TOKEN` is **not** a Netlify PAT. It's the Bearer token found in the `Authorization` header of their internal/undocumented API requests. How to get it is left to the reader as an exercise (or just contact me and I'll guide you; too lazy right now).
- You'll have to add records for the apex domain yourself on Cloudflare.

## License

[MIT](LICENSE)
