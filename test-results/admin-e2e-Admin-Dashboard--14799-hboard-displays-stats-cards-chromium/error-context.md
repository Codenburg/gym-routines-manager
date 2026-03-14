# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - heading "Champion Gym" [level=1] [ref=e7]
        - paragraph [ref=e8]: Panel de Administración
      - generic [ref=e9]:
        - generic [ref=e10]:
          - text: Email
          - textbox "Email" [ref=e11]:
            - /placeholder: admin@championgym.com
        - generic [ref=e12]:
          - text: Contraseña
          - textbox "Contraseña" [ref=e13]:
            - /placeholder: ••••••••
        - button "Iniciar Sesión" [ref=e14]
      - link "← Volver al inicio" [ref=e16] [cursor=pointer]:
        - /url: /
  - button "Open Next.js Dev Tools" [ref=e22] [cursor=pointer]:
    - generic [ref=e25]:
      - text: Rendering
      - generic [ref=e26]:
        - generic [ref=e27]: .
        - generic [ref=e28]: .
        - generic [ref=e29]: .
  - alert [ref=e30]
```