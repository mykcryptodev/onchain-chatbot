export default function OGTestPage() {
  const testCases = [
    {
      title: 'Default',
      url: '/api/og',
    },
    {
      title: 'Dark Theme (Default)',
      url: '/api/og?title=Onchain%20Chatbot&subtitle=AI%20Assistant%20for%20Web3&theme=dark',
    },
    {
      title: 'Light Theme',
      url: '/api/og?title=Onchain%20Chatbot&subtitle=AI%20Assistant%20for%20Web3&theme=light',
    },
    {
      title: 'Custom Title',
      url: '/api/og?title=Web3%20AI%20Bot&subtitle=Blockchain%20Intelligence&theme=dark',
    },
    {
      title: 'Long Title Test',
      url: '/api/og?title=Advanced%20Onchain%20AI%20Assistant&subtitle=Smart%20Contract%20Interactions%20and%20DeFi%20Operations&theme=dark',
    },
  ];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">OG Image Test Page</h1>
      <div className="grid gap-8">
        {testCases.map((testCase) => (
          <div key={testCase.title} className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{testCase.title}</h2>
            <div className="bg-gray-100 p-4 rounded">
              <img
                src={testCase.url}
                alt={`OG Image: ${testCase.title}`}
                className="w-full max-w-2xl mx-auto border rounded shadow-lg"
                style={{ aspectRatio: '1200/800' }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 font-mono break-all">
              URL: {testCase.url}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
