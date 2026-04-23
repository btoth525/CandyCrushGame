# Charles & Brandon's Wizarding World of Nuts -- static site image.
# Built on top of nginx:alpine. Image is ~25MB. Stateless, drop-in for Unraid.

FROM nginx:1.27-alpine

# Replace the default nginx config with one that knows about the manifest MIME
# type and sets sensible cache + service-worker headers.
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the game itself.
COPY game/ /usr/share/nginx/html/

EXPOSE 80

# nginx:alpine already sets a healthy CMD; nothing more to do.
