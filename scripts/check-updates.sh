#!/usr/bin/env sh

for i in $(find -name "package.json" -not -path  "*/node_modules/*"); do
  pushd "$(dirname "$i")"
  ncu $@
  popd
done
