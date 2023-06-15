const axios = require('axios');
const querystring = require('querystring');

exports.handler = async function(event) {
  console.log("Webhook received: ", event);

  // If this is the handshake to establish the webhook
  if (event.headers['X-Hook-Secret']) {
    console.log("Received X-Hook-Secret: ", event.headers['X-Hook-Secret']);
    return {
      statusCode: 200,
      headers: { 'X-Hook-Secret': event.headers['X-Hook-Secret'] },
      body: null
    };
  }

  // Get your Asana access token and user gid from the environment variables
  const asanaAccessToken = process.env.ASANA_ACCESS_TOKEN;
  const userId = process.env.USER_GID;

  const config = {
    headers: {
      'Authorization': `Bearer ${asanaAccessToken}`,
      'Content-Type': 'application/json'
    }
  };

  const eventBody = JSON.parse(event.body);

  for (let event of eventBody.events) {
    // Event for new task or subtask creation
    if (event.resource_subtype === "task" || event.resource_subtype === "subtask" && event.action === "added") {
      const taskId = event.resource.gid;

      const addCollabUrl = `https://app.asana.com/api/1.0/tasks/${taskId}/addCollaborators`;

      // Make a call to Asana API to add a collaborator
      try {
        const response = await axios.post(
          addCollabUrl,
          querystring.stringify({ collaborators: [userId] }),
          config
        );
        console.log("Added collaborator to task: ", response.data);
      } catch (error) {
        console.error("Failed to add collaborator to task: ", error);
      }
    }
  }
};
