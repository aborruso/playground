#!/bin/bash

set -x

folder="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$folder"/rawdata
mkdir -p "$folder"/processing

URLcatalogo="https://dati.anticorruzione.it/opendata/api/3/action/package_list"

curl -kL "$URLcatalogo" | jq . >"$folder"/rawdata/package_list.json
