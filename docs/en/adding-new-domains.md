# Adding New Domains

To add new domain konsti.example.com:

- Add new domain to Konsti Kubernetes configs
  - https://github.com/con2/konsti/blob/main/kubernetes/production.vars.yaml
- Add Kompassi OAuth Redirect to new domain
  - Kompassi admin UI -> Django OAuth Toolkit -> Applications -> Redirect uris
    ```
    https://konsti.example.com/auth/kompassi/callback
    ```
- Add new domain to Kompassi allowed CSP domains
  - https://github.com/con2/kompassi/commit/ca2708d3f6b43139eb39b0e4ee37032704db9239
- Consider removing the domain after it's not required anymore
  - https://github.com/con2/konsti/pull/881
