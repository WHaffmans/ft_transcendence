FROM alpine:3.23

# Install system + PHP runtime deps
RUN apk update && apk add --no-cache \
    nginx \
    supervisor \
    curl \
    git \
    zip \
    unzip \
    libpng \
    libxml2 \
    oniguruma \
    php84 \
    php84-bcmath \
    php84-cli \
    php84-ctype \
    php84-curl \
    php84-dom \
    php84-exif \
    php84-fileinfo \
    php84-fpm \
    php84-gd \
    php84-mbstring \
    php84-mysqlnd \
    php84-opcache \
    php84-openssl \
    php84-pcntl \
    php84-pdo \
    php84-pdo_mysql \
    php84-phar \
    php84-session \
    php84-simplexml \
    php84-sodium \
    php84-tokenizer \
    php84-xml \
    php84-xmlreader \
    php84-xmlwriter \
    composer

# PHP config paths (important!)
ENV PHP_INI_DIR=/etc/php84


# Install Composer
# COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first (layer cache)
COPY src/composer.json src/composer.lock* ./

# Install PHP dependencies
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

# Copy app source
COPY src/ .

# Optimize autoload
# RUN composer dump-autoload \
#     --no-dev \
#     --classmap-authoritative \
#     --no-interaction

# PHP-FPM config
COPY conf/php.ini /etc/php84/conf.d/custom.ini
COPY conf/php-fpm.conf /etc/php84/php-fpm.d/www.conf

# NGINX config
COPY conf/nginx.conf /etc/nginx/nginx.conf
COPY conf/default.conf /etc/nginx/http.d/default.conf

# Supervisor config
COPY conf/supervisord.conf /etc/supervisord.conf

# Entrypoint script
COPY conf/docker-entrypoint-prod.sh /usr/local/bin/docker-entrypoint-prod.sh
RUN chmod +x /usr/local/bin/docker-entrypoint-prod.sh

# Ensure www-data group exists
RUN getent group www-data || addgroup -g 82 -S www-data

# Ensure www-data user exists
RUN id -u www-data &>/dev/null || adduser -u 82 -D -S -G www-data www-data

# Create app directory and set permissions
RUN mkdir -p /var/www/html \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

RUN mkdir -p /var/lib/nginx/{logs,tmp,client_body} \
    && chown -R www-data:www-data /var/lib/nginx

RUN mkdir -p /var/log/php84 \
    && touch /var/log/php84/error.log \
    && chown -R www-data:www-data /var/log/php84


EXPOSE 80

ENTRYPOINT [ "/usr/local/bin/docker-entrypoint-prod.sh" ]

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
