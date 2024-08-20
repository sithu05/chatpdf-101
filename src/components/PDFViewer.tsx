export default function PDFViewer({ src }: { src: string }) {
	return (
		<iframe
			src={`https://docs.google.com/gview?url=${src}&embedded=true`}
			className="w-full h-full"
		></iframe>
	);
}
