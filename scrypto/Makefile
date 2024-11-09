SHELL=/bin/sh

# $(t) is an optional, single test to execute
test:
	@cargo test $(t) -- --show-output > ./tests/output/full-output.txt
	@$(MAKE) test-output
	@cat ./tests/output/output.txt

test-output:
	@sed '/Executable/,/Fee Summary/{/Fee Summary/!d};/Executable/d;/Fee Summary/i\ ' tests/output/full-output.txt > ./tests/output/output.txt

test-clean:
	@rm -rf ./tests/output/*
