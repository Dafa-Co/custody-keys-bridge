# Custody_Solution_Api

# for generating migrations
```bash
NODE_USERNAME=root NODE_PASSWORD=password NODE_DATABASE=bridge_db npm run migration:generate --name=init-migrations
```

# for running
```bash
NODE_USERNAME=root NODE_PASSWORD=password NODE_DATABASE=bridge_db npm run migration:run
```

# for seeder
```bash
NODE_USERNAME=root NODE_PASSWORD=password NODE_DATABASE=bridge_db NODE_SUBDOMAIN=rox npm run seeder
``
