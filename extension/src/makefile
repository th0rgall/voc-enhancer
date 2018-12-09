default: dist

dev: clean
	@if [ ! -d "../dist" ]; then mkdir -p ../dist; fi
	@cp -R manifest.json api content icons background.js ../dist/
	@browserify ../../api/vocabulary-api.js -o ../dist/api/vocabulary-api.js

dist: clean dev
	@cd ../dist && find . -path '*/.*' -prune -o -type f -print | zip ../voc-adder.zip -@

clean:
	@rm -rf ../dist
	@if [ -f "../voc-adder.zip" ]; then rm ../voc-adder.zip; fi