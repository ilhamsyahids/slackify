.PHONY: *

build:
	docker build -t slackify .

test:
	-make build
	docker run -it --rm \
		-e GITHUB_REPOSITORY=${GITHUB_REPOSITORY} \
		-e GITHUB_SHA=${GITHUB_SHA} \
		-e GITHUB_EVENT_NAME=${GITHUB_EVENT_NAME} \
		-e GITHUB_REF=${GITHUB_REF} \
		-e GITHUB_WORKFLOW=${GITHUB_WORKFLOW} \
		-e INPUT_JOB_NAME=Test \
		-e INPUT_MENTION=here \
		-e INPUT_MENTION_IF=failure \
		-e INPUT_URL="${SLACK_WEBHOOK}" \
		-e INPUT_COMMIT=true \
		-e INPUT_TYPE=success \
		-e INPUT_TOKEN="${GITHUB_TOKEN}" \
		slackify
