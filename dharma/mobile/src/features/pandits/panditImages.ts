import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";

import PanditRamesh from "../../../assets/pandits/pandit-ramesh.svg";
import PanditKrishna from "../../../assets/pandits/pandit-krishna.svg";
import PanditAnil from "../../../assets/pandits/pandit-anil.svg";
import PanditMahesh from "../../../assets/pandits/pandit-mahesh.svg";
import PanditSuresh from "../../../assets/pandits/pandit-suresh.svg";
import PanditVishnu from "../../../assets/pandits/pandit-vishnu.svg";
import PanditGopal from "../../../assets/pandits/pandit-gopal.svg";
import PanditVenkatesh from "../../../assets/pandits/pandit-venkatesh.svg";

const localPanditImages: Record<string, ComponentType<SvgProps>> = {
  "pandits/pandit-ramesh.png": PanditRamesh,
  "pandits/pandit-krishna.png": PanditKrishna,
  "pandits/pandit-anil.png": PanditAnil,
  "pandits/pandit-mahesh.png": PanditMahesh,
  "pandits/pandit-suresh.png": PanditSuresh,
  "pandits/pandit-vishnu.png": PanditVishnu,
  "pandits/pandit-gopal.png": PanditGopal,
  "pandits/pandit-venkatesh.png": PanditVenkatesh,
};

/** Resolves a seeded pandit image reference to bundled artwork, mirroring the Pooja Samagri strategy. */
export function getLocalPanditImage(imageReference?: string | null) {
  if (!imageReference) return undefined;
  return localPanditImages[imageReference];
}
