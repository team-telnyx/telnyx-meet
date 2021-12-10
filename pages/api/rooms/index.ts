import type { NextApiRequest, NextApiResponse } from 'next';

import { notify } from 'lib/bugsnag';

type Data = Array<{}>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${process.env.TELNYX_API_HOST}/rooms`, {
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        },
      });

      if (response.ok) {
        const { data } = await response.json();
        res.status(200).json(data);
      } else {
        notify(`${response.status}: Failed to get rooms`);
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
  } else {
    notify('405: Failed to get rooms');

    res.setHeader('Allow', 'GET');
    res.status(405).end();
  }
}
