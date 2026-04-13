# Production Deployment Checklist

This document outlines the required steps to successfully deploy the Laravel + Inertia + React (Vite) application to a production environment.

## 1. Environment Configuration

Ensure your production server's `.env` file is properly configured. Crucially:
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://your-production-domain.com`

Set secure and strong values for your application keys, database passords, and API keys.

## 2. Backend Dependencies

Install the PHP dependencies. Using the `--optimize-autoloader` and `--no-dev` flags ensures that strictly required dependencies are downloaded, reducing attack surface and speeding up composer initialization.

```bash
composer install --optimize-autoloader --no-dev
```

## 3. Frontend Build

With Vite, the assets need to be built and versioned for production. The `laravel-vite-plugin` automatically hashes and versions strings correctly—preventing issues with stale cached scripts showing for visiting end users.

```bash
npm install
npm run build
```
*Note: Depending on your server environment, you may build locally or inside a CI/CD pipeline and then upload the bundled `public/build` directory, skipping this step on the actual server.*

## 4. Laravel Optimizations

Run the following Artisan commands to cache configurations, routes, and views. These are critical for optimal application performance:

```bash
# Cache configuration files
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views (Blade templates)
php artisan view:cache

# Cache events (if using Laravel events/listeners)
php artisan event:cache
```

## 5. Migrations & Storage Link

Ensure your storage directory is properly linked to public, and migrate any pending database changes:

```bash
php artisan storage:link
php artisan migrate --force
```

## 6. Directory Permissions

Ensure your web server (e.g., Nginx or Apache) has proper read and write permissions to the storage and bootstrap cache directories:

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

(Adjust `www-data` to whichever user runs your web process, e.g., `nginx` or `apache`).

---
**Deployment Automation Note**: To prevent manual mishaps during updates, you might script the commands above in a repository pipeline (like GitHub Actions) or via a tool like Laravel Forge or Envoyer.
