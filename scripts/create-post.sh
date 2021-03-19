#!/usr/bin/env sh

if [ "$1" = "" ]; then
  echo "Position argument for filename is required." >&2
  exit 1
fi

filename="$(date +%F)-$1.md"

cat > "site/_posts/${filename}" << EOF
---
title: $1
author:
date: $(date --iso-8601=seconds -u | sed "s/\\+.*/Z/")
category:
tags:
---
EOF
