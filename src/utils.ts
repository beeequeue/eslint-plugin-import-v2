import memoize from "memoize"

// Gets the name of a dependency regardless if it is a deep import or not
// e.g. `wretch` => `wretch`, `wretch/addons/formUrl` => `wretch`
// Doesn't use .split() because it's faster to do it manually
export const getDependencyName = memoize((name: string) => {
  const splits = name.split("/")
  if (splits.length === 1) return name

  if (name[0] === "@") {
    return `${splits[0]}/${splits[1]}`
  }

  return splits[0]
})
