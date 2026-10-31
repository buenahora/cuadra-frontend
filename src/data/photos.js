const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;

export const PHOTOS = [
  U('1502672260266-1c1ef2d93688'),
  U('1522708323590-d24dbb6b0267'),
  U('1493809842364-78817add7ffb'),
  U('1560185007-cde436f6a4d0'),
  U('1502005229762-cf1b2da7c5d6'),
  U('1484154218962-a197022b5858'),
  U('1556909114-f6e7ad7d3136'),
  U('1554995207-c18c203602cb'),
  U('1567767292278-a4f21aa2d36e'),
  U('1560448204-e02f11c3d0e2'),
  U('1505691938895-1758d7feb511'),
  U('1512917774080-9991f1c4c750'),
];

export const photo = (i) => PHOTOS[(i % PHOTOS.length + PHOTOS.length) % PHOTOS.length];
