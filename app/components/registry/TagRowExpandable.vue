<template>
  <CollapsibleRoot v-model:open="isOpen" class="group">
    <!-- Trigger: Tag Row (clickable) -->
    <CollapsibleTrigger as-child>
      <Card
        variant="bordered"
        clickable
        class="transition-all duration-300 group-data-[state=open]:border-blue-500 dark:group-data-[state=open]:border-blue-400"
      >
        <div class="flex items-center justify-between gap-3">
          <!-- Tag Info -->
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <!-- Animated chevron -->
            <Icon
              :name="isOpen ? 'heroicons:chevron-down' : 'heroicons:chevron-right'"
              class="h-5 w-5 flex-shrink-0 text-gray-400 transition-all duration-300 group-hover:text-blue-600 group-data-[state=open]:rotate-180 dark:text-gray-500 dark:group-hover:text-blue-400"
            />
            <div class="min-w-0 flex-1 space-y-2">
              <!-- Primary: Tag name + Platform badge -->
              <div class="flex flex-wrap items-center gap-2">
                <!-- Tag name badge - Outlined, harmonized size -->
                <Badge
                  variant="info"
                  size="sm"
                  class="border border-blue-600 bg-transparent font-medium text-blue-700 dark:border-blue-400 dark:text-blue-300"
                >
                  {{ tag.name }}
                </Badge>

                <!-- Platform badge - Outlined neutral -->
                <Badge
                  v-if="tag.architecture && tag.os"
                  variant="default"
                  size="sm"
                  class="border border-gray-400 bg-transparent font-mono text-gray-700 dark:border-gray-500 dark:text-gray-300"
                >
                  <Icon name="heroicons:cpu-chip" class="mr-1 h-3 w-3" />
                  {{ tag.architecture }}/{{ tag.os }}
                </Badge>

                <!-- Status badge - Only show if Error or Incomplete -->
                <Badge
                  v-if="tag.hasError || !tag.manifestDetails || !tag.digest || tag.size === 0"
                  :class="getStatusOutlinedClass(tag)"
                  size="sm"
                >
                  {{ getStatusLabel(tag) }}
                </Badge>
              </div>

              <!-- Metrics row: Size + Layer count + Quick digest -->
              <div class="flex flex-wrap items-center gap-3 text-sm">
                <!-- Size -->
                <span class="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                  <Icon name="heroicons:cube" class="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  {{ formatBytes(tag.size) }}
                </span>

                <!-- Layer count -->
                <span
                  v-if="tag.manifestDetails?.layers"
                  class="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300"
                >
                  <Icon
                    name="heroicons:rectangle-stack"
                    class="h-4 w-4 text-gray-500 dark:text-gray-400"
                  />
                  {{
                    $t('registry.tag.details.layers-count', {
                      count: tag.manifestDetails.layers.length,
                    })
                  }}
                </span>

                <!-- Quick copy digest (hover) -->
                <Button
                  v-if="tag.digest"
                  :title="$t('actions.copy-digest')"
                  variant="ghost"
                  size="sm"
                  class="h-auto px-2 py-0.5 font-mono text-xs"
                  @click.stop="copyToClipboard(tag.digest, 'digest')"
                >
                  <Icon name="heroicons:finger-print" class="h-4 w-4" />
                  <span class="max-w-[120px] truncate">{{ tag.digest.substring(7, 19) }}</span>
                  <Icon name="heroicons:clipboard-document" class="h-3 w-3" />
                </Button>

                <!-- Created date -->
                <span
                  v-if="tag.createdAt"
                  class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
                >
                  <Icon name="heroicons:clock" class="h-3 w-3" />
                  {{ formatDate(tag.createdAt) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Pull Command (middle horizontal space) -->
          <div class="hidden min-w-0 max-w-md flex-1 items-center gap-2 lg:flex">
            <code
              class="min-w-0 flex-1 truncate rounded border bg-gray-100 px-2 py-1 font-mono text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50"
            >
              {{ pullCommand }}
            </code>
            <IconButton
              icon="heroicons:clipboard-document"
              :label="$t('common.copy')"
              variant="ghost"
              size="sm"
              @click.stop="copyToClipboard(pullCommand, 'pull command')"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <IconButton
              icon="heroicons:trash"
              :label="$t('actions.delete-tag')"
              variant="outline-danger"
              size="sm"
              @click.stop="handleDelete"
            />
          </div>
        </div>
      </Card>
    </CollapsibleTrigger>

    <!-- Collapsible Content: Tag Details -->
    <CollapsibleContent
      class="data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down overflow-hidden"
    >
      <!-- Error State -->
      <div
        v-if="tag.hasError"
        class="mt-2 rounded-lg border-2 border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
      >
        <div class="flex items-start gap-3">
          <Icon
            name="heroicons:exclamation-triangle"
            class="h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400"
          />
          <div class="flex-1">
            <h4 class="mb-1 font-semibold text-red-900 dark:text-red-100">
              {{ $t('registry.tag.error.title') }}
            </h4>
            <p class="text-sm text-red-800 dark:text-red-200">
              {{ tag.errorMessage || $t('registry.tag.error.unknown') }}
            </p>
          </div>
          <Button variant="outline-secondary" size="sm" @click="retryFetchTag">
            <Icon name="heroicons:arrow-path" class="h-4 w-4" />
            {{ $t('common.retry') }}
          </Button>
        </div>
      </div>

      <!-- Normal Content -->
      <div
        v-else
        class="mt-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800"
      >
        <div class="space-y-4">
          <!-- Pull Command -->
          <section>
            <h4
              class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
            >
              <Icon name="heroicons:command-line" class="h-4 w-4" />
              {{ $t('registry.tag.details.pull-command') }}
            </h4>
            <div class="flex items-center gap-2">
              <input
                type="text"
                :value="pullCommand"
                readonly
                class="flex-1 rounded border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50"
              />
              <Button
                size="sm"
                variant="ghost"
                @click="copyToClipboard(pullCommand, 'pull command')"
              >
                <Icon name="heroicons:clipboard-document" class="h-4 w-4" />
              </Button>
            </div>
          </section>

          <!-- Full Digest -->
          <section>
            <h4
              class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
            >
              <Icon name="heroicons:finger-print" class="h-4 w-4" />
              {{ $t('registry.tag.details.full-digest') }}
            </h4>
            <div class="flex items-center gap-2">
              <input
                type="text"
                :value="tag.digest"
                readonly
                class="flex-1 rounded border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50"
              />
              <Button size="sm" variant="ghost" @click="copyToClipboard(tag.digest, 'digest')">
                <Icon name="heroicons:clipboard-document" class="h-4 w-4" />
              </Button>
            </div>
          </section>

          <!-- Layers (Phase 1: Enhanced Visual Progress Bars) -->
          <section v-if="tag.manifestDetails">
            <h4
              class="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
            >
              <Icon name="heroicons:rectangle-stack" class="h-5 w-5" />
              {{ $t('registry.tag.details.layers') }}
              <Badge
                size="sm"
                class="border border-gray-400 bg-transparent text-gray-700 dark:border-gray-500 dark:text-gray-300"
              >
                {{ tag.manifestDetails.layers.length }}
              </Badge>
            </h4>
            <div class="space-y-3">
              <CollapsibleRoot
                v-for="(layer, index) in tag.manifestDetails.layers"
                :key="layer.digest"
                class="group/layer"
              >
                <div class="space-y-1.5">
                  <!-- Clickable Layer header -->
                  <CollapsibleTrigger as-child>
                    <button
                      class="flex w-full items-center justify-between text-xs transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <span
                        class="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300"
                      >
                        <Icon
                          name="heroicons:chevron-right"
                          class="h-3 w-3 transition-transform group-data-[state=open]/layer:rotate-90"
                        />
                        {{ $t('registry.tag.details.layer') }} {{ index + 1 }}
                      </span>
                      <span class="font-semibold text-gray-900 dark:text-white">
                        {{ formatBytes(layer.size) }}
                        <span class="text-gray-500 dark:text-gray-400"
                          >({{ getLayerPercentage(layer.size) }}%)</span
                        >
                      </span>
                    </button>
                  </CollapsibleTrigger>

                  <!-- Monochrome progress bar with hover effects -->
                  <div
                    class="group/bar relative h-3 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner dark:bg-gray-700"
                    :title="`Layer ${index + 1}: ${formatBytes(layer.size)} (${getLayerPercentage(layer.size)}%)`"
                  >
                    <div
                      :class="getLayerMonochromeClass(index)"
                      class="h-full rounded-full shadow-md transition-all duration-500 ease-out group-hover/bar:shadow-lg"
                      :style="{ width: `${getLayerPercentage(layer.size)}%` }"
                    />
                    <!-- Shine effect on hover -->
                    <div
                      class="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover/bar:opacity-100"
                    />
                  </div>

                  <!-- Collapsible Layer Details -->
                  <CollapsibleContent
                    class="data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down overflow-hidden"
                  >
                    <div
                      class="mt-2 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800/50"
                    >
                      <!-- Dockerfile Command -->
                      <div v-if="getLayerHistoryEntry(index)">
                        <dt class="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {{ $t('registry.tag.details.dockerfile-command') }}
                        </dt>
                        <dd
                          class="mt-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-900 dark:bg-gray-700 dark:text-white"
                        >
                          {{ parseDockerCommand(getLayerHistoryEntry(index)?.created_by || '') }}
                        </dd>
                      </div>

                      <!-- Layer Type Badge -->
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {{ $t('registry.tag.details.type') }}:
                        </span>
                        <Badge
                          :class="getLayerTypeBadgeClass(getLayerType(getLayerHistoryEntry(index)))"
                          size="sm"
                        >
                          {{
                            getLayerType(getLayerHistoryEntry(index)) === 'filesystem'
                              ? $t('registry.tag.details.filesystem-layer')
                              : $t('registry.tag.details.metadata')
                          }}
                        </Badge>
                      </div>

                      <!-- Full Digest with copy -->
                      <div>
                        <dt class="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Full Digest
                        </dt>
                        <dd class="mt-1 flex items-center gap-2">
                          <span
                            class="flex-1 truncate font-mono text-xs text-gray-500 dark:text-gray-400"
                          >
                            {{ layer.digest }}
                          </span>
                          <IconButton
                            icon="heroicons:clipboard-document"
                            :label="$t('common.copy')"
                            variant="ghost"
                            size="sm"
                            @click="copyToClipboard(layer.digest, `layer ${index + 1} digest`)"
                          />
                        </dd>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </CollapsibleRoot>
            </div>
          </section>

          <!-- Manifest Metadata (Phase 1) -->
          <section v-if="tag.manifestDetails">
            <h4
              class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
            >
              <Icon name="heroicons:document-text" class="h-4 w-4" />
              {{ $t('registry.tag.details.manifest') }}
            </h4>
            <dl class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt class="font-medium text-gray-600 dark:text-gray-400">
                  {{ $t('registry.tag.details.schema-version') }}
                </dt>
                <dd class="font-mono text-gray-900 dark:text-white">
                  {{ tag.manifestDetails.schemaVersion }}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-600 dark:text-gray-400">
                  {{ $t('registry.tag.details.media-type') }}
                </dt>
                <dd class="truncate font-mono text-xs text-gray-900 dark:text-white">
                  {{ tag.manifestDetails.mediaType }}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-600 dark:text-gray-400">
                  {{ $t('registry.tag.details.config-digest') }}
                </dt>
                <dd class="truncate font-mono text-xs text-gray-900 dark:text-white">
                  {{ tag.manifestDetails.config.digest.substring(0, 19) }}...
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-600 dark:text-gray-400">
                  {{ $t('registry.tag.details.config-size') }}
                </dt>
                <dd class="font-mono text-gray-900 dark:text-white">
                  {{ formatBytes(tag.manifestDetails.config.size) }}
                </dd>
              </div>
            </dl>
          </section>

          <!-- Config Details (Phase 2: On-Demand with Toggle) -->
          <section
            v-if="tag.manifestDetails"
            class="border-t border-gray-300 pt-4 dark:border-gray-500"
          >
            <!-- Toggle Button -->
            <div class="mb-3 text-center">
              <Button variant="secondary" size="sm" @click="toggleConfigDetails">
                <Icon
                  :name="isConfigExpanded ? 'heroicons:chevron-up' : 'heroicons:information-circle'"
                  class="h-4 w-4"
                />
                <span v-if="!tag.configDetails">
                  {{ $t('registry.tag.details.load-config') }}
                </span>
                <span v-else-if="isConfigExpanded">
                  {{ $t('registry.tag.details.hide-details') }}
                </span>
                <span v-else>
                  {{ $t('registry.tag.details.show-details') }}
                </span>
              </Button>
            </div>

            <!-- Loading State -->
            <div v-if="tag.isLoadingConfig" class="flex items-center justify-center py-4">
              <LoadingSpinner size="sm" :label="$t('registry.tag.details.loading-details')" />
            </div>

            <!-- Collapsible Config Content -->
            <CollapsibleRoot v-if="tag.configDetails" v-model:open="isConfigExpanded">
              <CollapsibleContent
                class="data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down overflow-hidden"
              >
                <div class="space-y-3">
                  <h4
                    class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    <Icon name="heroicons:cog" class="h-4 w-4" />
                    {{ $t('registry.tag.details.config') }}
                  </h4>

                  <!-- Architecture & OS -->
                  <dl class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt class="font-medium text-gray-600 dark:text-gray-400">
                        {{ $t('registry.tag.details.architecture') }}
                      </dt>
                      <dd class="font-mono text-gray-900 dark:text-white">
                        {{ tag.configDetails.architecture }}
                      </dd>
                    </div>
                    <div>
                      <dt class="font-medium text-gray-600 dark:text-gray-400">
                        {{ $t('registry.tag.details.os') }}
                      </dt>
                      <dd class="font-mono text-gray-900 dark:text-white">
                        {{ tag.configDetails.os }}
                      </dd>
                    </div>
                    <div v-if="tag.configDetails.created" class="sm:col-span-2">
                      <dt class="font-medium text-gray-600 dark:text-gray-400">
                        {{ $t('registry.tag.details.created') }}
                      </dt>
                      <dd class="font-mono text-gray-900 dark:text-white">
                        {{ formatDate(new Date(tag.configDetails.created)) }}
                      </dd>
                    </div>
                    <div v-if="tag.configDetails.author" class="sm:col-span-2">
                      <dt class="font-medium text-gray-600 dark:text-gray-400">
                        {{ $t('registry.tag.details.author') }}
                      </dt>
                      <dd class="text-gray-900 dark:text-white">{{ tag.configDetails.author }}</dd>
                    </div>
                  </dl>

                  <!-- Build History Button -->
                  <div v-if="tag.configDetails.history?.length" class="text-center">
                    <Button variant="secondary" size="sm" @click="openBuildHistoryModal">
                      <Icon name="heroicons:document-text" class="h-4 w-4" />
                      {{ $t('registry.tag.details.view-build-history') }}
                      <Badge
                        size="sm"
                        class="ml-2 border border-gray-400 bg-transparent text-gray-700 dark:border-gray-500 dark:text-gray-300"
                      >
                        {{
                          $t('registry.tag.details.steps', {
                            count: tag.configDetails.history.length,
                          })
                        }}
                      </Badge>
                    </Button>
                  </div>

                  <!-- Environment Variables -->
                  <div v-if="tag.configDetails.config?.Env?.length" class="space-y-1">
                    <dt class="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {{ $t('registry.tag.details.env-vars') }}
                    </dt>
                    <dd class="space-y-1">
                      <div
                        v-for="(env, idx) in tag.configDetails.config.Env"
                        :key="idx"
                        class="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-900 dark:bg-gray-700 dark:text-white"
                      >
                        {{ env }}
                      </div>
                    </dd>
                  </div>

                  <!-- Entrypoint -->
                  <div v-if="tag.configDetails.config?.Entrypoint?.length" class="space-y-1">
                    <dt class="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {{ $t('registry.tag.details.entrypoint') }}
                    </dt>
                    <dd
                      class="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-900 dark:bg-gray-700 dark:text-white"
                    >
                      {{ tag.configDetails.config.Entrypoint.join(' ') }}
                    </dd>
                  </div>

                  <!-- CMD -->
                  <div v-if="tag.configDetails.config?.Cmd?.length" class="space-y-1">
                    <dt class="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {{ $t('registry.tag.details.cmd') }}
                    </dt>
                    <dd
                      class="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-900 dark:bg-gray-700 dark:text-white"
                    >
                      {{ tag.configDetails.config.Cmd.join(' ') }}
                    </dd>
                  </div>

                  <!-- Exposed Ports -->
                  <div v-if="tag.configDetails.config?.ExposedPorts" class="space-y-1">
                    <dt class="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {{ $t('registry.tag.details.exposed-ports') }}
                    </dt>
                    <dd class="flex flex-wrap gap-1">
                      <Badge
                        v-for="(_, port) in tag.configDetails.config.ExposedPorts"
                        :key="port"
                        variant="info"
                        size="sm"
                      >
                        {{ port }}
                      </Badge>
                    </dd>
                  </div>
                </div>
              </CollapsibleContent>
            </CollapsibleRoot>
          </section>
        </div>
      </div>
    </CollapsibleContent>
  </CollapsibleRoot>

  <!-- Build History Modal -->
  <DialogRoot v-model:open="isBuildHistoryModalOpen">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <DialogContent
        class="fixed left-1/2 top-1/2 mx-4 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-600 dark:bg-gray-800 sm:mx-0 sm:p-6"
      >
        <!-- Header -->
        <DialogTitle class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          {{ $t('registry.tag.details.build-history') }}
          <Badge
            size="sm"
            class="ml-2 border border-gray-400 bg-transparent text-gray-700 dark:border-gray-500 dark:text-gray-300"
          >
            {{
              $t('registry.tag.details.steps', { count: tag.configDetails?.history?.length || 0 })
            }}
          </Badge>
        </DialogTitle>
        <DialogDescription class="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {{ $t('registry.tag.details.build-history-description') }}
        </DialogDescription>

        <!-- Scrollable Build History Content -->
        <div
          class="max-h-[60vh] space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-500 dark:bg-gray-900/50"
        >
          <div
            v-for="(step, idx) in tag.configDetails?.history"
            :key="idx"
            class="flex items-start gap-2 rounded bg-white px-3 py-2 dark:bg-gray-800"
          >
            <span
              class="flex-shrink-0 font-mono text-xs font-semibold text-gray-500 dark:text-gray-400"
            >
              {{ idx + 1 }}.
            </span>
            <div class="min-w-0 flex-1 space-y-1.5">
              <Badge
                :class="getLayerTypeBadgeClass(step.empty_layer ? 'metadata' : 'filesystem')"
                size="sm"
              >
                {{
                  step.empty_layer
                    ? $t('registry.tag.details.metadata')
                    : $t('registry.tag.details.filesystem')
                }}
              </Badge>
              <div class="min-w-0 break-words font-mono text-xs text-gray-900 dark:text-white">
                {{ parseDockerCommand(step.created_by || '') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" @click="copyBuildHistory">
            <Icon name="heroicons:clipboard-document" class="h-4 w-4" />
            {{ $t('actions.copy-all') }}
          </Button>
          <DialogClose as-child>
            <Button variant="secondary" size="sm">
              <Icon name="heroicons:x-mark" class="h-4 w-4" />
              {{ $t('common.close') }}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import {
  CollapsibleRoot,
  CollapsibleTrigger,
  CollapsibleContent,
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'

interface Props {
  tag: Tag
  repositoryName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  delete: [tag: Tag]
}>()

const logger = useAppLogger('component:tag-row-expandable')

const { formatBytes, formatDate } = useDockerRegistry()
const { success: showSuccess } = useToast()
const registryStore = useRegistryStore()
const config = useRuntimeConfig()
const { t } = useI18n()

const isOpen = ref(false)
const isConfigExpanded = ref(false)
const isBuildHistoryModalOpen = ref(false)

const pullCommand = computed(() => {
  const registryUrl = config.public.registryUrl
  return `docker pull ${registryUrl}/${props.repositoryName}:${props.tag.name}`
})

const getLayerPercentage = (layerSize: number): number => {
  if (!props.tag.size) {
    return 0
  }
  return Math.round((layerSize / props.tag.size) * 100)
}

const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showSuccess(t('common.copied-to-clipboard', { item: label }))
  } catch (error) {
    logger.error('Failed to copy to clipboard:', error)
  }
}

const copyBuildHistory = async () => {
  if (!props.tag.configDetails?.history) {
    return
  }

  const dockerfileContent = props.tag.configDetails.history
    .map((step: { empty_layer?: boolean; created_by?: string }, idx: number): string => {
      const type = step.empty_layer ? '[Metadata]' : '[Filesystem]'
      const command = parseDockerCommand(step.created_by || '')
      return `${idx + 1}. ${type} ${command}`
    })
    .join('\n')

  await copyToClipboard(dockerfileContent, 'Build history')
}

const openBuildHistoryModal = () => {
  isBuildHistoryModalOpen.value = true
}

const loadConfigDetails = async () => {
  try {
    await registryStore.fetchConfigBlob(props.repositoryName, props.tag)
    isConfigExpanded.value = true
  } catch (error) {
    logger.error('Failed to load config details:', error)
  }
}

const toggleConfigDetails = () => {
  if (!props.tag.configDetails) {
    loadConfigDetails()
  } else {
    isConfigExpanded.value = !isConfigExpanded.value
  }
}

const handleDelete = () => {
  emit('delete', props.tag)
}

const getStatusOutlinedClass = (tag: Tag): string => {
  if (tag.hasError) {
    return 'border border-red-500 bg-transparent text-red-700 dark:border-red-400 dark:text-red-300'
  }
  if (!tag.manifestDetails || !tag.digest || tag.size === 0) {
    return 'border border-yellow-500 bg-transparent text-yellow-700 dark:border-yellow-400 dark:text-yellow-300'
  }
  return 'border border-green-500 bg-transparent text-green-700 dark:border-green-400 dark:text-green-300'
}

const getStatusLabel = (tag: Tag): string => {
  if (tag.hasError) {
    return t('common.status.error')
  }
  if (!tag.manifestDetails || !tag.digest || tag.size === 0) {
    return t('common.status.incomplete')
  }
  return t('common.status.complete')
}

const layerMonochromeShades = [
  'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600',
  'bg-gradient-to-r from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700',
  'bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-500 dark:to-gray-600',
  'bg-gradient-to-r from-gray-500 to-gray-600 dark:from-gray-400 dark:to-gray-500',
]

const getLayerMonochromeClass = (index: number): string => {
  return layerMonochromeShades[index % layerMonochromeShades.length] || layerMonochromeShades[0]
}

const parseDockerCommand = (created_by: string): string => {
  if (!created_by) {
    return t('registry.tag.details.unknown-command')
  }
  const command = created_by
    .replace(/^\/bin\/sh -c #\(nop\) /, '')
    .replace(/^\/bin\/sh -c /, 'RUN ')
    .trim()

  return command
}

const getLayerHistoryEntry = (layerIndex: number) => {
  if (!props.tag.configDetails?.history) {
    return null
  }
  const filesystemHistory = props.tag.configDetails.history.filter(
    (h: { empty_layer?: boolean }) => !h.empty_layer
  )
  return filesystemHistory.at(layerIndex) || null
}

const getLayerType = (
  historyEntry: { empty_layer?: boolean } | null
): 'filesystem' | 'metadata' => {
  if (!historyEntry || historyEntry.empty_layer) {
    return 'metadata'
  }
  return 'filesystem'
}

const getLayerTypeBadgeClass = (type: 'filesystem' | 'metadata'): string => {
  if (type === 'filesystem') {
    return 'border border-green-500 bg-transparent text-green-700 dark:border-green-400 dark:text-green-300'
  }
  return 'border border-gray-400 bg-transparent text-gray-700 dark:border-gray-500 dark:text-gray-300'
}

const retryFetchTag = async () => {
  try {
    await registryStore.fetchTags(props.repositoryName)
  } catch (error) {
    logger.error('Failed to retry tag fetch:', error)
  }
}
</script>
