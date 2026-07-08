interface Props {
  onKeypress: () => void;
  disabled: boolean;
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

export default function VirtualKeyboard({ onKeypress, disabled }: Props) {
  return (
    <div className="virtual-keyboard" role="group" aria-label="On-screen keyboard — tap any key to draft your reply">
      {ROWS.map((row, i) => (
        <div key={i} className="vk-row">
          {row.map((key) => (
            <button key={key} type="button" className="vk-key" disabled={disabled} onClick={onKeypress}>
              {key}
            </button>
          ))}
        </div>
      ))}
      <div className="vk-row">
        <button type="button" className="vk-key vk-space" disabled={disabled} onClick={onKeypress}>
          SPACE
        </button>
      </div>
    </div>
  );
}
