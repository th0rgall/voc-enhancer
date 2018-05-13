default: dist

dist: clean
	@if [ ! -d "out" ]; then mkdir -p out; fi
	@cp -R manifest.json background.js content.js voc_favicon.png out/
	@cd out && find . -path '*/.*' -prune -o -type f -print | zip ../voc-adder.zip -@
	@rm -rf out

clean:
	@if [ -f "voc-adder.xip" ]; then rm voc-adder.zip; fi