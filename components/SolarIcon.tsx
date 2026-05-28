// components/SolarIcon.tsx
import React from "react";
import { SvgProps } from "react-native-svg";

// Import all needed icons
import AddCircle from "../assets/icons/solar-add-circle-bold.svg";
import Alarm from "../assets/icons/solar-alarm-bold.svg";
import AltArrowRight from "../assets/icons/solar-alt-arrow-right-bold.svg";
import Bell from "../assets/icons/solar-bell-bold.svg";
import Calendar from "../assets/icons/solar-calendar-bold.svg";
import CalendarDate from "../assets/icons/solar-calendar-date-bold.svg";
import CheckCircle from "../assets/icons/solar-check-circle-bold.svg";
import ClockCircle from "../assets/icons/solar-clock-circle-bold.svg";
import CloudDownload from "../assets/icons/solar-cloud-download-bold.svg";
import CloudUpload from "../assets/icons/solar-cloud-upload-bold.svg";
import Code from "../assets/icons/solar-code-bold.svg";
import Folder from "../assets/icons/solar-folder-bold.svg";
import HandShake from "../assets/icons/solar-hand-shake-bold.svg";
import Home from "../assets/icons/solar-home-bold.svg";
import Hourglass from "../assets/icons/solar-hourglass-bold.svg";
import InfoCircle from "../assets/icons/solar-info-circle-bold.svg";
import Lock from "../assets/icons/solar-lock-bold.svg";
import MusicNotes from "../assets/icons/solar-music-notes-bold.svg";
import QuestionCircle from "../assets/icons/solar-question-circle-bold.svg";
import Refresh from "../assets/icons/solar-refresh-bold.svg";
import Shield from "../assets/icons/solar-shield-bold.svg";
import SquareAcademicCap from "../assets/icons/solar-square-academic-cap-bold.svg";
import Stars from "../assets/icons/solar-stars-bold.svg";
import Videocamera from "../assets/icons/solar-videocamera-bold.svg";

interface SolarIconProps extends SvgProps {
  name: string;
  size?: number;
  color?: string;
}

const iconMap: Record<string, React.FC<SvgProps>> = {
  "add-circle": AddCircle,
  "alarm": Alarm,
  "alt-arrow-right": AltArrowRight,
  "bell": Bell,
  "calendar": Calendar,
  "calendar-date": CalendarDate,
  "check-circle": CheckCircle,
  "clock-circle": ClockCircle,
  "cloud-download": CloudDownload,
  "cloud-upload": CloudUpload,
  "code": Code,
  "folder": Folder,
  "hand-shake": HandShake,
  "home": Home,
  "hourglass": Hourglass,
  "info-circle": InfoCircle,
  "lock": Lock,
  "music-notes": MusicNotes,
  "question-circle": QuestionCircle,
  "refresh": Refresh,
  "shield": Shield,
  "square-academic-cap": SquareAcademicCap,
  "stars": Stars,
  "videocamera": Videocamera,
};

export default function SolarIcon({ name, size = 24, color = "#fff", ...props }: SolarIconProps) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <IconComponent width={size} height={size} color={color} {...props} />;
}
