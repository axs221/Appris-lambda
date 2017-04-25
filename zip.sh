#!/bin/bash
rm -rf ./out*
mkdir -p ./out/
chmod 777 *.js
cp -rf *.js ./out/
cp -rf ./node_modules/* ./out/
cd ./out
chmod 777 *
find ./ -exec chmod 777 {} \;
zip -r out.zip *
cp out.zip ..
chmod 777 ../out.zip
