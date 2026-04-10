import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  Stack,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Tfoot,
} from "@chakra-ui/react";
import { useSaveConfigOption } from "hooks";
import { Flavour, FlavourScreen } from "types";
import { generateNewFlavour, usesPerPageDwellInFlavourConfig } from "lib/flavour/utils";
import {
  FLAVOUR_NAME_MAX_LENGTH,
  SCREEN_DEFAULT_DISPLAY_LENGTH,
  SCREEN_DESCRIPTIONS,
  SCREEN_MIN_DISPLAY_LENGTH,
  SCREEN_NAMES,
  Screens,
} from "consts";
import axios from "lib/axios";

type FlavoursConfigProps = {
  currentFlavours: string[];
  /** Called when the flavour list changes on disk (save); updates the Display tab dropdown without a full page reload. */
  onFlavoursListChange?: (flavours: string[]) => void;
};

type SaveFlavourResponse = {
  flavour: Flavour;
  flavours: string[];
};

export function FlavoursConfig({ currentFlavours, onFlavoursListChange }: FlavoursConfigProps) {
  const toast = useToast();
  const { saveConfigOption, isSaving } = useSaveConfigOption<SaveFlavourResponse>("flavour", "");

  const [flavourNameUsed, setFlavourNameUsed] = useState(false);
  const [selectableFlavours, setSelectableFlavours] = useState(currentFlavours);
  const [mutableFlavour, setMutableFlavour] = useState<Flavour>();
  const [selectedFlavour, setSelectedFlavour] = useState<string>("");

  const flavoursListKey = currentFlavours.join("\u0001");
  useEffect(() => {
    setSelectableFlavours(currentFlavours);
  }, [flavoursListKey]);

  const isFlavourSaveable = !!mutableFlavour?.name?.length && !!mutableFlavour?.screens?.length && !flavourNameUsed;

  const doesFlavourNameExist = (name: string) => {
    const isUsed = selectableFlavours.map((flavourName) => flavourName.toLowerCase()).includes(name.toLowerCase());
    setFlavourNameUsed(isUsed);
    return isUsed;
  };

  const handleFlavourNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (doesFlavourNameExist(e.target.value))
      toast({
        title: "Flavour name already taken",
        description: "The name you have entered already exists, please choose another one.",
        status: "error",
      });

    setMutableFlavour({ ...mutableFlavour, name: e.target.value });
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.closeAll();

    mutableFlavour.modified = new Date();
    const data = await saveConfigOption({ flavour: mutableFlavour }, !!!mutableFlavour.uuid);

    if (data === undefined)
      return toast({
        title: "Unable to save",
        description: "An error occured saving your flavour",
        status: "error",
      });

    if (data.flavours) {
      setSelectableFlavours(data.flavours);
      onFlavoursListChange?.(data.flavours);
    }
    if (!mutableFlavour.uuid && data.flavour?.uuid) {
      setMutableFlavour({ ...mutableFlavour, uuid: data.flavour.uuid });
    }

    return toast({
      title: "Save successful",
      description: "Your flavour was saved",
      status: "success",
    });
  };

  const discardChanges = () => {
    setMutableFlavour(null);
    setSelectedFlavour("");
  };

  const createNewFlavour = () => {
    setMutableFlavour(generateNewFlavour());
  };

  const editFlavour = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedFlavour(e.target.value);
    if (!e.target.value) return setMutableFlavour(null);

    axios.get(`/flavour/${e.target.value}`).then((resp) => {
      const { data } = resp;
      if (!data || !data.flavour) return;

      setMutableFlavour(data.flavour as Flavour);
    });
  };

  const addScreenToFlavour = () => {
    if (!mutableFlavour) return;

    setMutableFlavour({
      ...mutableFlavour,
      screens: [...mutableFlavour.screens, { id: Screens.FORECAST, duration: SCREEN_DEFAULT_DISPLAY_LENGTH }],
    });
  };

  const deleteScreen = (ix: number) => {
    const newScreens = [...mutableFlavour.screens];
    newScreens.splice(ix, 1);

    setMutableFlavour({ ...mutableFlavour, screens: newScreens });
  };

  const updateScreenID = (e: ChangeEvent<HTMLSelectElement>, screen: FlavourScreen, ix: number) => {
    // update screen in temp array
    const newScreens = [...mutableFlavour.screens];
    newScreens.splice(ix, 1, {
      id: Number(e.target.value),
      duration: Math.max(
        SCREEN_MIN_DISPLAY_LENGTH,
        screen.duration >= SCREEN_MIN_DISPLAY_LENGTH ? screen.duration : SCREEN_DEFAULT_DISPLAY_LENGTH
      ),
    });

    // store to state
    setMutableFlavour({ ...mutableFlavour, screens: newScreens });
  };

  const updateScreenDuration = (e: ChangeEvent<HTMLInputElement>, screen: FlavourScreen, ix: number) => {
    // update screen in temp array
    const newScreens = [...mutableFlavour.screens];
    newScreens.splice(ix, 1, { ...screen, duration: Number(e.target.value) });

    // store to state
    setMutableFlavour({ ...mutableFlavour, screens: newScreens });
  };

  const onBlurScreenValidation = (screen: FlavourScreen, ix: number) => {
    // update screen in temp array
    const newScreens = [...mutableFlavour.screens];
    newScreens.splice(ix, 1, { ...screen, duration: Math.max(SCREEN_MIN_DISPLAY_LENGTH, Number(screen.duration)) });

    // store to state
    setMutableFlavour({ ...mutableFlavour, screens: newScreens });
  };

  const moveScreenPosition = (screen: FlavourScreen, ix: number, isUp: boolean = false) => {
    if ((isUp && ix < 1) || (!isUp && ix >= mutableFlavour.screens.length)) return;

    // remove it from where it was originally
    const newScreens = [...mutableFlavour.screens];
    newScreens.splice(ix, 1);

    // then put it one higher
    newScreens.splice(isUp ? ix - 1 : ix + 1, 0, screen);

    // store to state
    setMutableFlavour({ ...mutableFlavour, screens: newScreens });
  };

  return (
    <Stack spacing={6}>
      <Stack>
        <Text>
          Build the playlist order here. Timing (seconds) is one full step for most screens. For Forecast, Outlook, and
          Alerts, the number is per page: each paginated slide (forecast continuation, outlook segment, alert/CAP page)
          uses the same dwell, so total time grows with page count (e.g. 2 outlook pages at 10s ≈ 20s for that block).
          Minimum {SCREEN_MIN_DISPLAY_LENGTH}s per step.
        </Text>
      </Stack>

      <Stack direction={"row"} spacing={4} alignItems={"center"}>
        <Select placeholder="Select a flavour to edit" onChange={editFlavour} maxWidth={"md"} value={selectedFlavour}>
          {selectableFlavours.map((flavourName) => (
            <option key={flavourName} value={flavourName}>
              {flavourName}
            </option>
          ))}
        </Select>
        <Text>or</Text>
        <Button
          type="button"
          colorScheme="green"
          size={"md"}
          isDisabled={isSaving || !!mutableFlavour}
          onClick={createNewFlavour}
        >
          Create new flavour
        </Button>
      </Stack>

      {mutableFlavour && (
        <form onSubmit={onSubmit}>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Flavor Name</FormLabel>
              <Input
                value={mutableFlavour.name}
                onChange={handleFlavourNameChange}
                isDisabled={isSaving || !!mutableFlavour.uuid}
                maxLength={FLAVOUR_NAME_MAX_LENGTH}
              />
            </FormControl>

            <Text fontWeight={"medium"}>Flavour Screens</Text>
            <TableContainer>
              <Table variant={"striped"}>
                <Thead>
                  <Tr>
                    <Th>Screen</Th>
                    <Th>Timing (seconds)</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {mutableFlavour.screens?.length ? (
                    mutableFlavour.screens.map((screen, ix) => (
                      <Tr key={`screen.${ix}`}>
                        <Td>
                          <Select value={screen.id} onChange={(e) => updateScreenID(e, screen, ix)}>
                            {Object.keys(Screens)
                              .filter((screenID) => !isNaN(Number(screenID)))
                              .map((screenID) => (
                                <option
                                  key={`screen.option.${screenID}`}
                                  value={screenID}
                                  title={SCREEN_DESCRIPTIONS[Number(screenID) as Screens]}
                                >
                                  {SCREEN_NAMES[Number(screenID) as Screens]}
                                </option>
                              ))}
                          </Select>
                        </Td>
                        <Td>
                          <Stack spacing={1}>
                            <Input
                              value={
                                screen.duration >= SCREEN_MIN_DISPLAY_LENGTH
                                  ? screen.duration
                                  : SCREEN_DEFAULT_DISPLAY_LENGTH
                              }
                              type="number"
                              onChange={(e) => updateScreenDuration(e, screen, ix)}
                              onBlur={() => onBlurScreenValidation(screen, ix)}
                              min={SCREEN_MIN_DISPLAY_LENGTH}
                            />
                            <Text fontSize="xs" color="gray.500">
                              {usesPerPageDwellInFlavourConfig(screen.id)
                                ? "Per page (split slides each use this many seconds)."
                                : "One dwell for this whole step."}
                            </Text>
                          </Stack>
                        </Td>
                        <Td>
                          <Stack direction={"row"} spacing={2}>
                            <Button
                              isDisabled={isSaving}
                              colorScheme="blue"
                              onClick={() => moveScreenPosition(screen, ix, true)}
                              size={"sm"}
                            >
                              Move up
                            </Button>

                            <Button
                              isDisabled={isSaving}
                              colorScheme="blue"
                              onClick={() => moveScreenPosition(screen, ix)}
                              size={"sm"}
                            >
                              Move down
                            </Button>

                            <Button
                              isDisabled={isSaving}
                              colorScheme="red"
                              onClick={() => deleteScreen(ix)}
                              size={"sm"}
                            >
                              Delete
                            </Button>
                          </Stack>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={3}>Flavour has no screens, one screen must be present</Td>
                    </Tr>
                  )}
                </Tbody>
                <Tfoot>
                  <Tr>
                    <Td colSpan={3}>
                      <Button colorScheme="blue" size={"sm"} onClick={addScreenToFlavour} isDisabled={isSaving}>
                        Add screen
                      </Button>
                    </Td>
                  </Tr>
                </Tfoot>
              </Table>
            </TableContainer>

            <Button type="submit" colorScheme="teal" isLoading={isSaving} isDisabled={!isFlavourSaveable}>
              Save
            </Button>

            <Button type="button" colorScheme="red" isDisabled={isSaving} onClick={discardChanges}>
              Discard changes
            </Button>
          </Stack>
        </form>
      )}
    </Stack>
  );
}
