import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEvent } from "hooks/useEvent";
import { useEventSlots } from "hooks/useEventSlots";
import { useSlotBookMutation } from "hooks/useSlotBookMutation";
import { SlotTypeFilter } from "components/slots/SlotTypeFilter";
import { SlotsTable } from "components/slots/SlotsTable";
import { SlotPageHeader } from "components/slots/SlotPageHeader";
import { BookInfoMessage } from "components/slots/BookInfoMessage";
import { ContentWrapper } from "components/slots/ContentWrapper";
import { LoadingIndicator } from "components/LoadingIndicator";
import { ActionButton } from "components/button/Button";
import { SlotTypeOptions } from "types/SlotFilter";
import { Slot } from "types/Slot";

export default function SlotsPage() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { data: event, isLoading: isLoadingEvent } = useEvent(Number(eventId));
    const { data: slots, isLoading: isLoadingSlots, hasNextPage, isFetchingNextPage, fetchNextPage } = useEventSlots(Number(eventId));
    const bookMutation = useSlotBookMutation();

    const [selectedSlotType, setSelectedSlotType] = useState(SlotTypeOptions.LANDING);

    const tableData = useMemo(() => {
        if (!slots) {
            return null;
        }

        const allPagesData = slots.pages.map(slotPage => slotPage.data.map(slot => slot));
        return ([] as Slot[]).concat(...allPagesData);
    }, [slots]);

    const onSlotBook = (slotId: number) => {
        bookMutation.mutate({ slotId, eventId: Number(eventId) });
    }

    if (isLoadingEvent || isLoadingSlots || bookMutation.isLoading || !event) {
        return (
            <LoadingIndicator />
        )
    }

    if (bookMutation.isSuccess) {
        navigate("/slot/scheduled", { state: { slotId: bookMutation.variables } });
        return null;
    }

    return (
        <div className="flex flex-col md:flex-row h-full">
            <div className="md:max-w-[18rem]">
                <SlotTypeFilter
                    eventName={event.eventName}
                    eventType={event.type}
                    slotsQtdData={{ takeoff: 1, landing: 1, private: 2 }}
                    selectedSlotType={selectedSlotType}
                    onSlotTypeChange={(selectedType) => setSelectedSlotType(selectedType)} />
            </div>

            <ContentWrapper>
                <SlotPageHeader />
                {bookMutation.isError
                    ? (
                        <BookInfoMessage
                            header="Não foi possível agendar esse voo..."
                            description="Esses dados podem não existir no nosso sistema ou já foram reservados por outro piloto."
                            type="error"
                            onErrorReset={() => bookMutation.reset()}
                        />
                    )
                    : (
                        <>
                            <div className="mx-2 md:ml-8 md:mr-4 mt-4 overflow-x-auto">
                                {tableData
                                    ? <SlotsTable slots={tableData} onSlotBook={onSlotBook} />
                                    : (
                                        <BookInfoMessage
                                            header="Parece que já não há mais nada para você aqui..."
                                            description="Esses dados podem não existir no nosso sistema, verifique os filtros aplicados ou tente novamente mais tarde. "
                                            type="warning"
                                            onErrorReset={() => { }}
                                        />
                                    )}
                            </div>
                            {(tableData && hasNextPage) && (
                                <div className="flex justify-center my-8">
                                    {isFetchingNextPage
                                        ? (
                                            <div className="relative">
                                                <LoadingIndicator />
                                            </div>
                                        )
                                        : (
                                            <ActionButton content="Carregar mais voos" backgroundFilled={false} onClick={() => fetchNextPage()} />
                                        )}
                                </div>
                            )}
                        </>
                    )}
            </ContentWrapper>
        </div>
    );
}