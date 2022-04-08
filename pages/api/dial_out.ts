import type { NextApiRequest, NextApiResponse } from 'next';

import { notify } from 'lib/bugsnag';

type Data = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'POST') {
    if (
      req.body &&
      req.body.video_room_id &&
      req.body.video_room_context &&
      req.body.to
    ) {
      try {
        const response = await fetch(
          `${process.env.TELNYX_CALL_CONTROL_API_HOST}/dial_out`,
          {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          res.status(200).json(response);
        } else {
          notify(`${response.status}: Failed to dial out`);
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
    notify('405: Failed to dial out');

    res.setHeader('Allow', 'POST');
    res.status(405).end();
  }
}
