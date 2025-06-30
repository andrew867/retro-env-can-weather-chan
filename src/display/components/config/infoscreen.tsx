import { Button, FormControl, FormLabel, Stack, Text, Textarea, useToast } from "@chakra-ui/react";
import { useSaveConfigOption } from "hooks";
import { FormEvent, useState } from "react";

type InfoScreenConfigProps = {
  infoScreen: string[];
};

export function InfoScreenConfig({ infoScreen }: InfoScreenConfigProps) {
  const toast = useToast();
  const { saveConfigOption, isSaving, wasSuccess, wasError } = useSaveConfigOption("infoScreen");

  const [mutableInfoScreen, setMutableInfoScreen] = useState(infoScreen?.join("\n"));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.closeAll();

    await saveConfigOption({ infoScreen: mutableInfoScreen.split("\n") });

    console.log("checking state!");
    if (wasError)
      return toast({
        title: "Unable to save",
        description: "An error occured updating your info screen messages",
        status: "error",
      });

    if (wasSuccess)
      return toast({
        title: "Save successful",
        description: "Your info screen messages were saved",
        status: "success",
      });
  };

  return (
    <Stack>
      <Text>Add messages to the info screen display - one line holds one info screen message.</Text>

      <form onSubmit={onSubmit}>
        <FormControl>
          <FormLabel>Info Screen Messages</FormLabel>
          <Textarea value={mutableInfoScreen} onChange={(e) => setMutableInfoScreen(e.target.value)} rows={6} />
        </FormControl>

        <Button type="submit" mt={4} colorScheme="teal" isLoading={isSaving}>
          Save
        </Button>
      </form>
    </Stack>
  );
}
