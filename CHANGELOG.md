# Changelog

## 0.1.5 (2026-11-07)

### Changes

* nav and shortcuts underline the key's first letter (**f**eatures, **c**opy) instead of showing it separately, so the nav fits on one line on phones
* styles are mobile first, with breakpoints at 768px and 1024px
* phones: the status bar scrolls in at the end of the page instead of sticking to the bottom, and the docs contents box is dropped (it stays as the sticky sidebar from 1024px)
* phones: the install command and the next step shrink just enough to stay on one line, with "then" above the next step

## 0.1.4 (2026-11-07)

### Features

* document groups on the docs page: path routing, the stripped prefix and BASE_PATH, the shared database, slugs, and adding apps to an installed group with boxx group add
* show boxx v0.4.0 in the title bar

## 0.1.3 (2026-11-07)

### Changes

* show boxx v0.3.3 in the title bar

## 0.1.2 (2026-11-06)

### Features

* stamp the installer at get.boxxup.com with the boxx commit it came from, linking to the file at that commit

## 0.1.1 (2026-11-06)

### Features

* say boxx is a personal project: a muted note in the status bar, and a "before you run it" popup whenever the install command is copied, with links to the installer and the boxx source

## 0.1.0 (2026-11-06)

### Features

* launch boxxup.com: the TUI deploy intro, the 8-bit BOXX, the install command, key-bar nav and a theme picker with seven themes
* features and docs pages, and a 404 page
* serve the boxx installer at get.boxxup.com, so `curl https://get.boxxup.com | sh` installs boxx
