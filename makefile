default: pack_ff pack_chr
# Bash instead of default /bin/sh for bracket expansion support
SHELL = /bin/zsh

CP_COMMON_SOURCES = cp -R src/{api,content,icons,background.js}
BROWSERIFY_API = @browserify ./node_modules/voc-api/vocabulary-api.js -o	

build: build_ff build_chr

build_ff: clean_ff
	if [ ! -d "dist/firefox" ]; then mkdir -p dist/firefox; fi
	${CP_COMMON_SOURCES} dist/firefox
	${BROWSERIFY_API} dist/firefox/api/vocabulary-api.js
	npx preprocess src/manifest.json -CHROME=false > dist/firefox/manifest.json	

build_chr: clean_chr
	if [ ! -d "dist/chrome" ]; then mkdir -p dist/chrome; fi
	${CP_COMMON_SOURCES} dist/chrome
	${BROWSERIFY_API} dist/chrome/api/vocabulary-api.js
	npx preprocess src/manifest.json -CHROME=true > dist/chrome/manifest.json

pack_ff: clean_ff build_ff
	## pack ff zip
	pushd dist/firefox && zip -r ../voc-enhancer-ff.zip *; popd

pack_chr: clean_chr build_chr
	## pack chrome extension
	# TODO: generated crx does not work
	# npx crx pack dist/chrome -p chrome.pem > dist/voc-api-chr.crx 
	# TODO: investigate this one further
	#open -a "Google Chrome" --args --pack-extension=${PWD}/dist/chrome --pack-extension-key=${PWD}/browser-extension.pem
	# chrome needs zip for upload
	pushd dist/chrome && zip -r ../voc-enhancer-chr.zip *; popd

clean: clean_ff clean_chr

clean_ff:
	rm -rf dist/firefox
	if [ -f "dist/voc-enhancer-ff.zip" ]; then rm dist/voc-enhancer-ff.zip; fi

clean_chr:
	rm -rf dist/chrome
	if [ -f "dist/voc-enhancer-chr.crx" ]; then rm dist/voc-enhancer-ff.crx; fi

pack_src:
	zip -r dist/voc-enhancer-src.zip * -x dist/\* -x node_modules/\* -x \*.pem -x \*.crx -x \*.zip;
