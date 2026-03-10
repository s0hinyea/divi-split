import DiviLogo from "../imports/divi-logo.svg";

export default function App() {
  return (
    <div className="size-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-400">
      <img src={DiviLogo} alt="Divi Logo" className="w-auto h-64" />
    </div>
  );
}