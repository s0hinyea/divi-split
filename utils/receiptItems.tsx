export type ReceiptItem = {
  name: string;
  price: number;
};

export type OCRResponse = {
  text: string;
  items: ReceiptItem[];
} | {
  error?: string;
};

export let ExtractedData: OCRResponse = {}