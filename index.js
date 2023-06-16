const axios = require("axios");

exports.handler = async function (event) {
  console.log("Webhook received: ", event);

  // This is the handshake to establish the webhook. It's what's called in response
  // to initiating a webhook with:
  //
  //   curl -H "Authorization: Bearer your-asana-access-token" \
  //      -H "Content-Type: application/json" \
  //      -X POST "https://app.asana.com/api/1.0/webhooks" \
  //      -d '{
  //            "data": {
  //              "resource": "your-project-id-or-task-id",
  //              "target": "https://your-public-url.com/asana-webhook-endpoint"
  //            }
  //          }'
  //
  if (event.headers["x-hook-secret"]) {
    console.log("Received x-hook-secret: ", event.headers["x-hook-secret"]);
    return {
      statusCode: 200,
      headers: { "x-hook-secret": event.headers["x-hook-secret"] },
      body: null,
    };
  }

  const asanaAccessToken = process.env.ASANA_ACCESS_TOKEN;
  const userIds = process.env.ASANA_USER_GIDS.split(",");

  const config = {
    headers: {
      Authorization: `Bearer ${asanaAccessToken}`,
      "Content-Type": "application/json",
    },
  };

  const payload = JSON.parse(event.body);
  for (let event of payload.events) {
    if (
      event.resource?.resource_subtype === "default_task" &&
      event.action === "added"
    ) {
      const taskId = event.resource.gid;
      try {
        const response = await axios.post(
          `https://app.asana.com/api/1.0/tasks/${taskId}/addFollowers`,
          {
            data: {
              followers: userIds,
            },
          },
          config
        );
        console.log("Added collaborator to task: ", response.data);
      } catch (error) {
        console.error("Failed to add collaborator to task: ", error);
      }
    }
  }
};
