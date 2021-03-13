#!/bin/bash

### requisiti ###
# parallel https://www.gnu.org/software/parallel/
# gdal/ogr https://gdal.org/
# jq https://github.com/stedolan/jq
# miller https://github.com/johnkerl/miller
### requisiti ###

set -x

folder="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$folder"/lavorazione

git pull

URLcsw="http://www.sitr.regione.sicilia.it/geoportale/csw"

# leggi la risposta HTTP del sito
code=$(curl -s -kL -o /dev/null -w '%{http_code}' "$URLcsw")

# se l'endpoint CSW risponde, estrai report CSW
if [ $code -eq 200 ]; then

  # scarica dati del catalogo
  ogr2ogr -F geojson "$folder"/SITRcatalogo.geojson CSW:""$URLcsw"" -oo ELEMENTSETNAME=full -oo FULL_EXTENT_RECORDS_AS_NON_SPATIAL=YES -oo MAX_RECORDS=500 --config GML_SKIP_CORRUPTED_FEATURES YES

  # estrai dal catalogo le informazioni di base, in formato CSV
  jq <"$folder"/SITRcatalogo.geojson -c '.features[]|{type,identifier:.properties.identifier,properties_type:.properties.type,subject:.properties.subject,othersubject:(if .properties.other_subjects|length > 0 then .properties.other_subjects|join(",") else .properties.other_subjects end),references:.properties.references,abstract:.properties.abstract}' |
    mlr --j2c unsparsify then \
      put '
  $properties_type=gsub($properties_type,"[\(\)]","");
  if($properties_type=~"downloadableData"){$downloadableData=1}else{$downloadableData=0}
  ' >"$folder"/SITRcatalogo.csv

  # estrai dal CSV ID risorsa e URL
  mlr --c2t cut -f identifier,references "$folder"/SITRcatalogo.csv | tail -n +2 >"$folder"/lavorazione/SITRcatalogo_check.tsv

  aggiornaDati="sì"

  # se debug è impostato a "sì" fai il check soltanto su 10 record
  debug="no"

  if [[ "$debug" == "sì" ]]; then
    head <"$folder"/lavorazione/SITRcatalogo_check.tsv | sponge "$folder"/lavorazione/SITRcatalogo_check.tsv
  fi

  # raccogli la risposta HTTP delle varie risorse
  if [[ $aggiornaDati == "sì" ]]; then
    if [ -f "$folder"/lavorazione/check_http.jsonl ]; then
      rm "$folder"/lavorazione/check_http.jsonl
    fi
    parallel --line-buffer --colsep "\t" -j 10 'echo '"'"'{"id":"{1}","http_code": "'"'"'"$(curl -kL -s -o /dev/null -w "%{http_code}" {2})"'"'"'"}'"'"' >>./lavorazione/check_http.jsonl' :::: ./lavorazione/SITRcatalogo_check.tsv
  fi

  # converti il file con le risposte da JSON a CSV
  mlr --j2c unsparsify then put '$IPA=sub($id,"^(.+):(.+)$","\1")' "$folder"/lavorazione/check_http.jsonl >"$folder"/lavorazione/check_http.csv

  # crea copia del check http precedente
  mv "$folder"/check_http.csv "$folder"/check_http_old.csv
  # crea copia file ultimo check
  cp "$folder"/lavorazione/check_http.csv "$folder"/check_http.csv

  # rinomina campo file check precedente
  mlr -I --csv rename http_code,http_code_old "$folder"/check_http_old.csv
  # crea file per visualizzare le variazioni di risposta HTTP dal check corrente al precedente
  mlr --csv join --ul -j id -f "$folder"/check_http_old.csv then unsparsify then rename http_code,http_code_latest "$folder"/check_http.csv >"$folder"/check_http_variazioni.csv

  # estrai tutti i record che sono variati e non sono più 200
  mlr --csv filter -S '$http_code_old!=$http_code_latest && $http_code_latest!=~"^2"' "$folder"/check_http_variazioni.csv >"$folder"/check_http_alert.csv

  # estrai tutti i record che sono passati da 200 a 500
  mlr --csv filter -S '$http_code_old=~"^2" && $http_code_latest=~"^5"' "$folder"/check_http_variazioni.csv >"$folder"/check_http_alert_200_500.csv

  # fai il JOIN tra anagrafica risorse e risposte HTTP
  mlr --csv join --ul -j identifier -l identifier -r id -f "$folder"/SITRcatalogo.csv then unsparsify then reorder -f identifier,http_code then sort -f identifier "$folder"/lavorazione/check_http.csv >"$folder"/report.csv

fi
