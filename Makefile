REPORTER ?= dot

test:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha src/test -R $(REPORTER)

.PHONY: test

