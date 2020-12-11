#!/bin/bash

set -x

folder="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# se lo script è lanciato sul PC di andy, leggi l'API KEY di IFTTT dal file locale
if [[ $(hostname) == "DESKTOP-7NVNDNF" ]]; then
  source "$folder"/../../.config
fi

mkdir -p "$folder"/rawdata
mkdir -p "$folder"/processing

URLcatalogo="https://dati.anticorruzione.it/opendata/api/3/action/package_list"

curl -kL "$URLcatalogo" | jq . >"$folder"/rawdata/package_list.json

jq <"$folder"/rawdata/package_list.json -r '.result[]' | sort >"$folder"/processing/listaDataset

# 2020-12-11
numeroDatasetTrigger=46

conteggioDataset=$(jq <"$folder"/rawdata/package_list.json -r '.result[]' | wc -l)

if [[ "$conteggioDataset" -ne "$numeroDatasetTrigger" ]]; then
  echo "checkNumero 1" >"$folder"/processing/check
  checkNumero=1
else
  echo "checkNumero 0" >"$folder"/processing/check
  checkNumero=0
fi

if jq <"$folder"/rawdata/package_list.json -r '.result[]' | grep -iP 'partec'; then
  echo "checkPartecipanti 1" >>"$folder"/processing/check
  checkPartecipanti=1
else
  echo "checkPartecipanti 0" >>"$folder"/processing/check
  checkPartecipanti=0
fi

# se ci sono novità sul repo, avvisami
if [ "$checkNumero" -eq 1 ]; then
  echo "errori numero"
  curl -X POST -H "Content-Type: application/json" -d '{"value1":"Portale ANAC: cambiato numero dataset"}' https://maker.ifttt.com/trigger/alert/with/key/"$IFTTT"
elif [ "$checkPartecipanti" -eq 1 ]; then
  echo "errori lista"
  curl -X POST -H "Content-Type: application/json" -d '{"value1":"Portale ANAC: introdotto dataset partecipanti"}' https://maker.ifttt.com/trigger/alert/with/key/"$IFTTT"
else
  echo "nulla"
fi
