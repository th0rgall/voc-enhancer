default: dist

dist: clean
	@if [ ! -d "out" ]; then mkdir -p out; fi
	@cp -R manifest.json vocabulary-api.js background.js content.js icons out/
	@cd out && find . -path '*/.*' -prune -o -type f -print | zip ../voc-adder.zip -@
	@rm -rf out

clean:
	@if [ -f "voc-adder.zip" ]; then rm voc-adder.zip; fi