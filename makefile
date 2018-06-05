default: dist

dev: clean
	@if [ ! -d "out" ]; then mkdir -p out; fi
	@cp -R manifest.json api content icons background.js out/

dist: clean dev
	@cd out && find . -path '*/.*' -prune -o -type f -print | zip ../voc-adder.zip -@

clean:
	@rm -rf out
	@if [ -f "voc-adder.zip" ]; then rm voc-adder.zip; fi