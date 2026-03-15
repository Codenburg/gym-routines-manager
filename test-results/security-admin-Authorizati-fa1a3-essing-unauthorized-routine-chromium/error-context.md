# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - heading "Champion Gym" [level=1] [ref=e7]
        - paragraph [ref=e8]: Panel de Administración
      - generic [ref=e9]:
        - paragraph [ref=e11]: Invalid email or password
        - generic [ref=e12]:
          - text: Email
          - textbox "Email" [ref=e13]:
            - /placeholder: admin@championgym.com
            - text: user@test.com
        - generic [ref=e14]:
          - text: Contraseña
          - textbox "Contraseña" [ref=e15]:
            - /placeholder: ••••••••
            - text: TestUser123!
        - button "Iniciar Sesión" [ref=e16]
      - link "← Volver al inicio" [ref=e18] [cursor=pointer]:
        - /url: /
  - button "Open Next.js Dev Tools" [ref=e24] [cursor=pointer]:
    - img [ref=e25]
  - alert [ref=e28]
```