interface TableInvoicesProps {
  invoice: string;
}

export default function TableInvoices({ invoice }: TableInvoicesProps) {
  return <div>TableInvoices {invoice}</div>;
}
