import { getIcon, IconType } from "./Icons";

interface Props {
  titleLeft?: string;
  titleRight?: string;
  onClickLeft?: () => void;
  onClickRight?: () => void;

  label?: string;
  selected?: "Left" | "Right";
  iconLeft?: IconType;
  iconRight?: IconType;
}

const optionClassName =
  "flex min-h-10 items-center gap-1 border border-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-blue-400 aria-pressed:border-blue-600 aria-pressed:bg-blue-700";

export default function Toggle(props: Props) {
  return (
    <div>
      {props.label && <span className="mb-2 block text-sm font-bold">{props.label}</span>}

      <div className="flex justify-center" role="group" aria-label={props.label}>
        <button
          type="button"
          aria-pressed={props.selected === "Left"}
          onClick={props.onClickLeft}
          className={`${optionClassName} rounded-s-lg`}
        >
          {props.iconLeft && getIcon(props.iconLeft)}
          {props.titleLeft}
        </button>

        <button
          type="button"
          aria-pressed={props.selected === "Right"}
          onClick={props.onClickRight}
          className={`${optionClassName} -ml-px rounded-e-lg`}
        >
          {props.iconRight && getIcon(props.iconRight)}
          {props.titleRight}
        </button>
      </div>
    </div>
  );
}
