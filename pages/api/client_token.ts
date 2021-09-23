import type { NextApiRequest, NextApiResponse } from 'next';

import { notify } from '../../lib/bugsnag';

type Data = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'POST') {
    if (req.body && req.body.room_id) {
      try {
        const response = await fetch(
          `${process.env.TELNYX_API_HOST}/rooms/${req.body.room_id}/actions/generate_join_client_token`,
          {
            method: 'POST',
            body: JSON.stringify({
              refresh_token_ttl_secs: 3600,
              token_ttl_secs: 60,
            }),
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
            },
          }
        );

        if (response.ok) {
          const { data } = await response.json();
          res.status(200).json(data);
        } else {
          notify(`${response.status}: Failed to generate client token`);
          if (response.status >= 500) {
            res.status(response.status).end();
          } else {
            const json = await response.json();
            res.status(response.status).json(json);
          }
        }
      } catch (error) {
        notify(error);

        res.status(500).end();
      }
    }
  } else {
    notify('405: Failed to generate client token');

    res.setHeader('Allow', 'POST');
    res.status(405).end();
  }
}
